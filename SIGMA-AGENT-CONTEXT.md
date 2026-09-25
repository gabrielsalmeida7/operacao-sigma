# Operação Sigma — contexto para agentes

Este arquivo descreve o **modelo mental** do Sigma. O banco SQLite sozinho não explica o ciclo rotativo, TQR, transições de matéria nem o significado dos enums. Use este documento **junto** com o `.db`.

- **App:** desktop Tauri (Windows), estudos de concurso (ATRF / Receita Federal — Analista Tributário).
- **Material de estudo:** Estratégia Concursos (PDFs Pré-Edital).
- **Banco:** SQLite. Arquivo local em `%APPDATA%\com.operacao.sigma\sigma.db` (não fica na pasta do projeto).
- **Booleanos no SQLite:** `0` = false, `1` = true.
- **Datas:** strings ISO (`2026-08-20T16:32:00.000Z`) ou chave de dia `YYYY-MM-DD`. Semanas de missão: `strftime('%Y-%W', ...)`.
- **FKs:** lógicas (não há `FOREIGN KEY` no schema Prisma). Inteiros `null`/`0` = sem vínculo.

---

## 1. O que o Sigma faz

Sistema gamificado de estudos. O núcleo operacional é o **ciclo rotativo ATRF**: uma fila circular de sessões (não um calendário). Se o usuário faltar um dia, retoma a sessão onde parou.

Outras telas: timer TQR/Pomodoro/livre, missões, quests, projetos, hábitos, loja de recompensas, conquistas, árvore de conhecimento, áreas da vida, editais, relatório semanal, histórico, projeções (“Meu Futuro”), backup exportar/importar.

Rotas: `/` Dashboard, `/study` Estudo, `/cycles` Ciclos, `/cycle-guide` Guia, `/missions`, `/quests`, `/projects`, `/habits`, `/rewards`, `/achievements`, `/knowledge`, `/life-areas`, `/weekly`, `/editals`, `/activity`, `/history`, `/future`, `/settings`.

---

## 2. Ideia central do ciclo (leia isto antes das tabelas)

**Não existe “segunda é Constitucional”.** Existe uma **fila** de N sessões (padrão **12** × **50 min**).

1. `StudyCycle.currentBlockNumber` aponta para a sessão **agora**.
2. Cada sessão é um `StudyCycleBlock` com `blockNumber` 1…N.
3. Ao concluir, o bloco é **pintado** em `StudyCycleCompletion` (volta + cor).
4. O ponteiro avança. Se passou do último bloco → `currentBlockNumber = 1` e `currentLap += 1`.
5. Cores da volta (`weekColorIndex` / `weekColor`): azul, verde, âmbar, roxo, rosa, ciano — ciclo de 6.

`dayNumber` e `slotInDay` são só agrupamento visual (3 slots/dia no template). **Não** amarram a um dia da semana.

Sábado / ciclo misto (`blockType = MIXED`) **não avança teoria** da fila; serve para discursiva, simulado, revisão mista.

---

## 3. Como ligar as tabelas (grafo)

```
UserProfile (id=1)          AppSettings (id=1)
        │                          │
        │                          └── selectedEditalId → TargetEdital.id
        │
LifeArea ←── Discipline.lifeAreaId
                │
                ├── bookmarkLessonCode / bookmarkPdfName / bookmarkNote  (“onde parei”)
                ├── DisciplineTopic.disciplineId
                │         └── TopicSegmentProgress.topicId  (segmentos A/B/C = 1/2/3)
                │
                ├── StudyCycleBlock.disciplineId
                ├── StudyActivityLog.disciplineId (+ topicId opcional)
                ├── StudySession.disciplineId
                ├── QuestionLog.disciplineId (+ topicId, segment, sessionId)
                ├── EditalDiscipline.disciplineId  ↔  TargetEdital (editalId)
                ├── Project.disciplineId / Quest.disciplineId
                └── XpEvent.disciplineId

StudyCycle (isActive=1 = ciclo vigente)
    ├── editalId → TargetEdital.id
    ├── StudyCycleBlock.cycleId   (fila; UNIQUE cycleId+blockNumber)
    └── StudyCycleCompletion.cycleId  (sessões pintadas; UNIQUE cycleId+blockNumber+lap)

Habit ← HabitLog.habitId
Quest.projectId → Project.id
Achievement ← UserAchievement.achievementId
MissionTemplate ← MissionProgress.templateId  (periodKey = dia ou semana)
Reward ← RewardRedemption.rewardId
```

**Pergunta típica “o que estudar agora?”**

```
StudyCycle WHERE isActive = 1
  → currentBlockNumber, currentLap, weeklySessions, sessionMinutes
  → StudyCycleBlock WHERE cycleId = ? AND blockNumber = currentBlockNumber
       → disciplineId → Discipline  (nome, fase, bookmark, cycleState)
       → thematicFocus, studyHint, blockType
  → “onde parou” = bookmark da Discipline (se preenchido), senão pdfsCurrent / tópicos
  → StudyCycleCompletion WHERE cycleId + lap = currentLap  → quais sessões já foram feitas nesta volta
```

---

## 4. Tabelas e significado dos campos

### 4.1 UserProfile / AppSettings

Uma linha cada (`id = 1`).

| Campo | Significado |
|-------|-------------|
| `dailyGoalMin` | Meta diária de minutos |
| `totalXp`, `level` | XP global. Nível: `xpForLevel(n) = round(100 * n^1.5)` |
| `currentStreak`, `bestStreak`, `lastStreakDate` | Streak de estudo |
| `totalStudyMin`, `totalQuestions`, `totalCorrect` | Totais acumulados |
| `futureTargetDate` | Data alvo da tela “Meu Futuro” |
| `checkInEnabled` | Check-in diário ao abrir |
| `selectedEditalId` | Edital em foco |

### 4.2 Discipline — o coração do progresso

Cada matéria (Constitucional, Tributário, etc.).

| Campo | Valores / leitura |
|-------|-------------------|
| `slug` | Identificador estável (`direito-constitucional`, `ltf`, `informatica`…) |
| `studyPhase` | `PDF` = teoria; `QUESTIONS` = fase de questões |
| `pdfsCurrent` / `pdfsTotal` | Contador de PDFs/aulas na fase teoria. `pdfsCurrent >= pdfsTotal` (com total > 0) = teoria acabou |
| `isInCycle` | 1 = entra na fila gerada |
| `studyPriority` | `VERY_HIGH` \| `HIGH` \| `MEDIUM` \| `LOW` |
| `cycleRole` | `BASE` = bloco básico agora; `SPECIFIC` = entra depois; `FINAL` = reta final |
| `cycleState` | `ACTIVE` = teoria na fila; `MAINTENANCE` = 1 sessão/volta de manutenção (questões); `LOCKED` = fora da fila |
| `weightPercent` | Peso na geração da fila (só matérias ACTIVE) |
| `cognitiveGroup` | `LAW` / `EXACT` / `LANGUAGE` — o gerador tenta alternar grupos |
| `unlockAfterSlug` | Só desbloqueia depois que a matéria desse slug fechou teoria |
| `theoryComplete` | 1 = teoria marcada como fechada |
| `cycleSortOrder` | Ordem na UI / catálogo |
| **Bookmark (manual)** | |
| `bookmarkLessonCode` | Aula, ex. `"01"` |
| `bookmarkPdfName` | Nome do PDF/material |
| `bookmarkNote` | Página, item, parágrafo (“p. 47, Art. 5º”) |

**Como ler “onde parou” (lógica da UI):**

1. Se houver bookmark (aula, PDF ou nota) → concatenar `Aula XX · nome do PDF · nota`.
2. Senão, fase `PDF` → `PDF {pdfsCurrent}/{pdfsTotal}` (ou “Nunca iniciado”).
3. Senão, fase `QUESTIONS` → primeiro tópico não `COMPLETED` + segmento A/B/C.

O bookmark é **por matéria**, não por bloco. Regenerar a fila **não apaga** o bookmark.

### 4.3 StudyCycle

| Campo | Leitura |
|-------|---------|
| `isActive` | Só um ciclo ativo na prática |
| `currentBlockNumber` | Sessão atual na fila |
| `currentLap` | Volta (1, 2, 3…) |
| `weeklySessions` | Tamanho da fila (12) |
| `sessionMinutes` | Duração TQR (50) |
| `weekColorIndex` | 0–5, cor da volta atual |
| `dayCount`, `blocksPerDay`, `studyWeekdaysJson`, `reviewDaySlotsJson` | **Legado** de um modelo calendário 8×3. O ciclo rotativo ignora isso na operação |

### 4.4 StudyCycleBlock

Uma linha = uma posição na fila.

| Campo | Leitura |
|-------|---------|
| `blockNumber` | Ordem 1…N |
| `blockType` | `DISCIPLINE` (estudo da matéria), `REVIEW` (questões mistas), `MIXED` (sábado) |
| `disciplineId` | Matéria da sessão (null em MIXED/REVIEW) |
| `thematicFocus` | Foco temático do template ATRF |
| `studyHint` | Dica de estudo |
| `isManualOverride` | 1 = usuário arrastou/editou; regenerar **preserva** se pedido |

### 4.5 StudyCycleCompletion

Histórico de sessões **concluídas**, por volta.

- Mesmo `blockNumber` pode aparecer em várias `lap`.
- `weekColor` = hex da cor da volta na hora da conclusão.
- Desfazer última sessão apaga o completion mais recente e recua `currentBlockNumber` / `currentLap`.

### 4.6 DisciplineTopic + TopicSegmentProgress

Tópicos/aulas da matéria (fase questões).

- `lessonCode`: `"00"`, `"01"`…
- `topicStatus`: `IN_PROGRESS` \| `COMPLETED` \| `MANDATORY_REVIEW`
- `lastAccuracyPercent`: último gate TQR
- Segmentos `1,2,3` = A, B, C de questões do tópico

**Gate de 70%:** se acertos/resolvidas < 70%, o tópico vira `MANDATORY_REVIEW`. A próxima sessão TQR dessa matéria começa com **30 min de reestudo dos erros**, não com teoria nova.

### 4.7 StudyActivityLog

Log manual (“registre a aula de hoje”): `phase`, `reference` (texto livre), `quantity` (página/qtd), `correctCount`, `isFinished`. Complementa, não substitui, o bookmark.

### 4.8 StudySession / QuestionLog

Timer e registro de questões. `QuestionLog.isSimulado = 1` = simulado. `segment` 1–3. `phase` pode espelhar fase de estudo.

### 4.9 TargetEdital / EditalDiscipline

Editais-alvo e peso da matéria no edital. Independente da fila, mas o ciclo pode ter `editalId`.

### 4.10 Gamificação e vida

| Tabela | Papel |
|--------|--------|
| `XpEvent` | Ledger de XP (`source`: estudo, questão, missão, conquista…) |
| `DailyCheckIn` | Missão do dia + completed |
| `Achievement` / `UserAchievement` | Catálogo vs desbloqueadas |
| `MissionTemplate` / `MissionProgress` | Diárias/semanais; `unit` = minutes \| questions; `periodKey` identifica o período |
| `DailyStats` / `MonthlySnapshot` | Agregados para gráficos |
| `LifeArea` | Áreas da vida; disciplinas/quests/hábitos podem apontar para ela |
| `Project` / `Quest` | Tarefas; status `NOT_STARTED` \| `IN_PROGRESS` \| `DONE` |
| `Habit` / `HabitLog` | Hábito + log por data (unique habitId+date) |
| `Reward` / `RewardRedemption` | Loja: gasta XP |

XP aproximado: 1/min estudo, 3/questão resolvida, 5/acerto, 50/simulado, 25/meta diária, +10 bônus pomodoro.

---

## 5. Catálogo ATRF (não está todo no banco)

O seed cria as matérias abaixo. Estados **iniciais**; o banco evolui com o uso.

### Fase 1 — BASE (Active, na fila)

| Slug | Matéria | Peso % |
|------|---------|--------|
| `direito-constitucional` | Direito Constitucional | 17 |
| `portugues` | Língua Portuguesa | 16 |
| `raciocinio-logico` | Raciocínio Lógico-Matemático | 17 |
| `direito-tributario` | Direito Tributário | 17 |
| `direito-administrativo` | Direito Administrativo | 16 |
| `contabilidade-geral` | Contabilidade Geral | 8 |
| `informatica` | Fluência em Dados | 9 |

### Fase 2 — SPECIFIC (Locked até desbloquear)

Ordem de inserção: Previdenciário → Aduaneira → LTF → LTC.

| Slug | Matéria | Pré-requisito |
|------|---------|---------------|
| `direito-previdenciario` | Direito Previdenciário | — |
| `legislacao-aduaneira` | Legislação Aduaneira | — |
| `ltf` | Legislação Tributária | `direito-tributario` |
| `ltc` | Reforma Tributária | `direito-tributario` |

**Regra de ouro:** não estudar LTF/LTC antes de fechar a teoria de Tributário.

### Fase 3 — FINAL (Locked; reta final)

`ingles`, `administracao-publica`, `administracao-geral`, `administracao-compras`, `administracao-financeira`, `estatistica`, `direito-tributario-jurisprudencial` (após tributário), `analise-demonstracoes` (após contabilidade).

Aliases comuns no Estratégia: `informatica` = Fluência em Dados; `ltf` = Legislação Tributária Federal; `ltc` = Legislação Tributária sobre o Consumo.

---

## 6. Como a fila é gerada

Arquivo de lógica: `cycleGenerator.ts` (não está no banco).

1. Se as 7 BASE estão `ACTIVE` + `isInCycle` e não há específica ACTIVE extra, e `weeklySessions = 12` → usa o **template 12h** (12 slots fixos com `thematicFocus`/`studyHint`).
2. Senão: fila **ponderada**
   - cada `MAINTENANCE` ganha **1** sessão por volta
   - o restante das sessões é distribuído pelas `ACTIVE` segundo `weightPercent`
   - tenta não repetir o mesmo `cognitiveGroup` em seguida

Regenerar com `preserveManual` mantém blocos `isManualOverride = 1`.

---

## 7. Sessão TQR (Timer de Operação)

Protocolo de ~50 min em `/study`. **Não** é persistido como fase; só o resultado (questões, PDF, completion).

| Fase | Duração típica | Quando |
|------|----------------|--------|
| `error_review` | 30 min | Tópico em `MANDATORY_REVIEW` |
| `current_review` | ~8 min | Há tópico anterior concluído |
| `theory` | ~40 min | PDF no Estratégia |
| `questions` | ~10 min | Questões de fixação |

Fluxo ao **passar** no gate (≥70%): incrementa `pdfsCurrent` se fase PDF; pode marcar `theoryComplete`; conclui a sessão e avança a fila; se a matéria deve ir para manutenção, desbloqueia a próxima específica e **regenera** a fila.

Se **falhar** o gate: tópico → `MANDATORY_REVIEW`; a fila ainda pode avançar (a sessão foi feita), mas a próxima vez nessa matéria começa pelos erros.

Timers alternativos: Pomodoro e modo livre (`StudySession`).

---

## 8. Transição BASE → manutenção → específicas

Quando a matéria **fecha teoria** (`theoryComplete` ou `pdfsCurrent >= pdfsTotal`):

1. `cycleState = MAINTENANCE`, `studyPhase = QUESTIONS`, continua `isInCycle`.
2. Procura a próxima específica `LOCKED` em `SPECIFIC_INSERTION_ORDER` cujo `unlockAfterSlug` já foi satisfeito.
3. Essa específica vira `ACTIVE`, `isInCycle = 1`, `studyPhase = PDF`.
4. A fila é regenerada (manutenções = 1 slot; novas ACTIVE entram no peso).

Manutenção = não abandonar a matéria: 1 sessão por volta, em geral questões.

---

## 9. Consultas úteis para um agente

**Ciclo ativo e ponteiro**

```sql
SELECT id, name, currentBlockNumber, currentLap, weeklySessions, sessionMinutes, isActive
FROM StudyCycle WHERE isActive = 1;
```

**Sessão de agora (com matéria e bookmark)**

```sql
SELECT b.blockNumber, b.blockType, b.thematicFocus, b.studyHint,
       d.name, d.slug, d.studyPhase, d.cycleRole, d.cycleState,
       d.pdfsCurrent, d.pdfsTotal, d.theoryComplete,
       d.bookmarkLessonCode, d.bookmarkPdfName, d.bookmarkNote
FROM StudyCycle c
JOIN StudyCycleBlock b ON b.cycleId = c.id AND b.blockNumber = c.currentBlockNumber
LEFT JOIN Discipline d ON d.id = b.disciplineId
WHERE c.isActive = 1;
```

**Fila completa**

```sql
SELECT b.blockNumber, b.blockType, d.name, b.thematicFocus
FROM StudyCycle c
JOIN StudyCycleBlock b ON b.cycleId = c.id
LEFT JOIN Discipline d ON d.id = b.disciplineId
WHERE c.isActive = 1
ORDER BY b.blockNumber;
```

**O que já foi pintado nesta volta**

```sql
SELECT blockNumber, weekColor, completedAt
FROM StudyCycleCompletion
WHERE cycleId = (SELECT id FROM StudyCycle WHERE isActive = 1)
  AND lap = (SELECT currentLap FROM StudyCycle WHERE isActive = 1)
ORDER BY blockNumber;
```

**Matérias e papel no ciclo**

```sql
SELECT name, slug, cycleRole, cycleState, isInCycle, weightPercent,
       studyPhase, pdfsCurrent, pdfsTotal, theoryComplete,
       bookmarkLessonCode, bookmarkPdfName, bookmarkNote
FROM Discipline
ORDER BY cycleSortOrder, name;
```

**Tópicos em revisão obrigatória**

```sql
SELECT d.name, t.lessonCode, t.name AS topic, t.lastAccuracyPercent, t.topicStatus
FROM DisciplineTopic t
JOIN Discipline d ON d.id = t.disciplineId
WHERE t.topicStatus = 'MANDATORY_REVIEW';
```

---

## 10. Como interpretar o estado (heurísticas)

- `currentBlockNumber = 5`, `currentLap = 3` → está na 5ª sessão da 3ª volta.
- Completions da lap atual com 4 linhas e fila de 12 → 4/12 sessões desta volta feitas.
- Bookmark preenchido **manda** sobre `pdfsCurrent` na hora de dizer “onde retomar”.
- `cycleState = LOCKED` e `isInCycle = 0` → ainda não entrou na fila (específica/final).
- `MAINTENANCE` + `QUESTIONS` → teoria daquela matéria fechou; 1 slot de manutenção.
- Várias específicas `ACTIVE` → já houve transição; a fila provavelmente **não** é mais o template 12h puro.
- `blockType = MIXED` na sessão atual → não é PDF da fila; discursiva/simulado/revisão.
- `StudySession.isActive = 1` → timer aberto (pode estar inconsistente se o app fechou no crash).
- Perfil `totalXp` / `level` vs `XpEvent`: o perfil é o acumulado; o ledger detalha fontes.

---

## 11. O que o banco **não** contém

- Textos dos PDFs do Estratégia (só referências: bookmark, lessonCode, nomes).
- Fase TQR em andamento (timer em memória).
- Cores/UI, template 12h e ordem de inserção (este arquivo + código).
- Relacionamentos Prisma (`@relation`) — joins manuais pelos IDs.
- O arquivo `.db` da pasta `prisma/` **não** é o banco do app em produção.

---

## 12. Backup entre PCs

O usuário usa **um computador por vez**: exporta o `.db` (Google Drive) e importa no outro. Não há sync em tempo real. Ao analisar um dump, trate-o como **snapshot** da última máquina que exportou.

---

## 13. Resposta padrão ao ler o banco

Ao resumir o estado, cubra nesta ordem:

1. Nome do ciclo, volta, sessão atual / total, minutos da sessão.
2. Matéria da sessão atual, tipo de bloco, foco temático.
3. Onde parou (bookmark > PDF > tópico/segmento).
4. Matérias ACTIVE vs MAINTENANCE vs LOCKED.
5. Gate: algum tópico em `MANDATORY_REVIEW`?
6. Ritmo recente: `DailyStats`, `StudySession`, `QuestionLog`, XP/streak do perfil.

Se faltar ciclo ativo ou blocos, o app ainda não montou a fila (`ensureActiveCycle` / “Criar ciclo ATRF de 12h”).
