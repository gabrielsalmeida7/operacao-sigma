# Operação Sigma — Contexto do Projeto

> Documento de referência para agentes e colaboradores. Descreve o estado atual do projeto, arquitetura e convenções.

---

## Visão geral

**Operação Sigma** é um aplicativo **desktop gamificado para estudos e produtividade pessoal**. O usuário registra tempo de estudo, questões resolvidas e simulados; o sistema converte isso em XP, níveis, streaks, missões e conquistas para manter motivação e visibilidade do progresso.

**Papel atual:** auxiliar pessoal de estudos — foco em registro manual, métricas e gamificação leve. Em expansão para suportar **múltiplas áreas da vida** (concurso, programação, saúde, etc.), inspirado em dashboards Notion gamificados.

**Versão:** 1.0.0 (V2 entregue; **V3 em andamento**).

**Idioma da UI:** português (Brasil).

**Identificador Tauri:** `com.operacao.sigma`

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Desktop | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript + Vite 7 |
| Roteamento | React Router DOM 7 |
| Estado global | Zustand (timer de estudo, celebrações) |
| Dados remotos/cache | TanStack React Query |
| UI | TailwindCSS 3 + Shadcn/UI (Radix) + Lucide icons |
| Gráficos | Recharts |
| Banco local | SQLite via `@tauri-apps/plugin-sql` |
| Schema/tipos (dev) | Prisma 6 (migrations e seed; runtime usa SQL direto) |
| Plugins Tauri | sql, fs, dialog, opener |

---

## Arquitetura

```
Sigma/
├── src/                    # Frontend React
│   ├── routes/             # Páginas (uma por rota)
│   ├── components/         # UI reutilizável (dashboard, check-in, celebrações, skill tree)
│   ├── lib/
│   │   ├── db/             # Cliente SQLite, migrations, repositories, seed
│   │   ├── gamification/   # Motor de XP, streaks, missões, conquistas
│   │   ├── projections/    # Projeções "Meu Futuro"
│   │   └── reports/        # Relatório semanal
│   ├── stores/             # Zustand (studyStore, celebrationStore)
│   └── hooks/              # useDailyCheckIn, etc.
├── src-tauri/              # Shell Rust mínimo (plugins apenas)
├── prisma/                 # schema.prisma + seed.ts
└── scripts/                # tauri-with-rust.mjs (PATH do Cargo no Windows)
```

### Fluxo de dados

1. **UI** chama funções em `lib/gamification/engine.ts` ou repositories.
2. **Engine** atualiza SQLite, calcula XP, dispara missões/conquistas/streak.
3. **CelebrationEvent[]** retornados são empilhados no `celebrationStore` → toasts/modais.
4. **React Query** invalida caches após mutações.

### Persistência

- Banco: `sigma.db` no **AppData** do usuário (Tauri).
- Migrations em runtime: `src/lib/db/migrations.ts` (SQL bruto, idempotente).
- Seed na primeira execução: conquistas, missões, disciplinas e áreas da vida (`seed-data.ts`).
- Post-migrate: backfill de dados e vínculos (`post-migrate.ts`).
- **Importante:** `npm run dev` (só Vite) **não persiste** — requer `npm run tauri:dev`.

---

## Modelo de dados (Prisma / SQLite)

Entidades principais:

| Modelo | Função |
|--------|--------|
| `UserProfile` | Nome, meta diária (min), XP total, nível, streak, totais acumulados |
| `AppSettings` | Tema, check-in habilitado, data alvo futura, edital selecionado |
| `LifeArea` | **V3** — Áreas da vida (Concurso, Programação, Saúde…) com cor, ícone e stats |
| `Discipline` | Matérias/tópicos com XP/nível; vinculadas a uma `LifeArea` |
| `TargetEdital` | Concursos alvo (nome, órgão, data da prova) |
| `EditalDiscipline` | N:N edital ↔ disciplina com peso |
| `StudySession` | Sessões do cronômetro (ativa/pausada, duração, disciplina) |
| `QuestionLog` | Registro de questões ou simulado |
| `DailyCheckIn` | Check-in diário com texto de missão |
| `DailyStats` | Agregados por dia (minutos, questões, meta atingida) |
| `MonthlySnapshot` | Agregados mensais para histórico/gráficos |
| `XpEvent` | Log de eventos de XP |
| `Achievement` / `UserAchievement` | Conquistas e desbloqueios |
| `MissionTemplate` / `MissionProgress` | Missões diárias/semanais e progresso por período |
| `Quest` | **V3** — Tarefas manuais do usuário com XP, prioridade, prazo e status |
| `Project` | **V3** — Metas maiores com quests vinculadas e XP bônus ao concluir |
| `Habit` / `HabitLog` | **V3** — Hábitos diários e registro por data (heat map + streak) |

**Áreas seed (V3):** Concurso, Programação, Saúde, Desenvolvimento Pessoal.

**Disciplinas seed:** Direito Constitucional, Direito Administrativo, Informática, Português, Raciocínio Lógico (vinculadas à área Concurso).

---

## Rotas e telas

| Rota | Tela | Descrição |
|------|------|-----------|
| `/` | Dashboard | Nível, XP, streak, meta do dia, edital próximo, highlights, feed resumido |
| `/study` | Estudo | Cronômetro, registro de questões; disciplinas agrupadas por área |
| `/missions` | Missões | Missões diárias e semanais automáticas com progresso |
| `/quests` | **Quests** | **V3** — Tarefas manuais com XP, prioridade, prazo e conclusão |
| `/projects` | **Projetos** | **V3** — Metas com subtarefas, barra de progresso e XP bônus |
| `/habits` | **Hábitos** | **V3** — Rotinas diárias, streak, heat map e XP |
| `/rewards` | **Loja** | **V3** — Prêmios definidos pelo usuário; resgate gasta XP |
| `/achievements` | Conquistas | Grid de conquistas (consistência, questões, horas) |
| `/knowledge` | Conhecimento | Skill tree SVG + CRUD de disciplinas com seleção de área |
| `/life-areas` | **Áreas da Vida** | **V3** — CRUD de áreas, stats e vínculo de disciplinas |
| `/weekly` | Relatório | Comparativo semana atual vs anterior |
| `/editals` | Editais | CRUD de editais alvo e vínculo com disciplinas |
| `/activity` | Atividade | Timeline de sessões, questões, XP, conquistas |
| `/history` | Histórico | Gráficos mensais (minutos, questões, XP) |
| `/future` | Meu Futuro | Projeções com base na média dos últimos 30 dias |
| `/settings` | Configurações | Nome, meta diária, data alvo, check-in, export backup |

Layout: sidebar fixa (`AppShell`) + área principal com grid de fundo temático.

---

## Roadmap V3 — Expansão (inspirado em templates Notion)

Origem: análise de dashboards Notion (RPG Weekly Planner, Productivity Vault, Life Planner, Student Life OS, Gamified Habit Tracker).

### Alta prioridade — em implementação sequencial

| # | Feature | Status | Descrição |
|---|---------|--------|-----------|
| 1 | **Áreas da vida (Life Areas)** | **✅ Entregue** | Nível acima de disciplinas: Concurso, Programação, Saúde… CRUD, stats, vínculo |
| 2 | **Quests (tarefas manuais)** | **✅ Entregue** | Tarefas criadas pelo usuário com XP, prioridade, prazo e conclusão |
| 3 | **Projetos / Missions** | **✅ Entregue** | Metas maiores com prazo, quests vinculadas e progresso agregado |
| 4 | **Hábitos + heat map** | **✅ Entregue** | Hábitos diários com streak, heat map 12 semanas e XP ao marcar hoje |
| 5 | **Pomodoro integrado** | ✅ entregue | Tabs Cronômetro/Pomodoro em `/study`; ciclos 25/5/15; pausa longa a cada 4 focos; +10 XP bônus por foco |
| 6 | **Loja de recompensas** | ✅ entregue | CRUD de prêmios em `/rewards`; resgate gasta XP; histórico e feed de atividade |
| 7 | **Barras temporais (ano/mês/semana)** | ✅ entregue | Widget no dashboard com % decorrido e dias restantes (semana seg–dom) |

### Média prioridade

| # | Feature | Descrição |
|---|---------|-----------|
| 8 | Cursos / trilhas de estudo | Cards por curso (React, Python…) com assignments e progresso |
| 9 | Calendário semanal de tarefas | Quests distribuídas por dia da semana |
| 10 | Prioridade + status em tarefas | Alta/Média/Baixa + Não iniciada/Em progresso/Concluída/Atrasada |
| 11 | Mini to-do rápido | Lista simples no dashboard sem XP |
| 12 | Briefing diário enriquecido | Resumo automático do dia (meta, tarefas, streak) |
| 13 | Metas trimestrais | Objetivos de longo prazo além dos editais |

### Baixa prioridade

| # | Feature | Descrição |
|---|---------|-----------|
| 14 | Eisenhower Matrix | Priorização urgente/importante em 4 quadrantes |
| 15 | Wheel of Life (radar) | Autoavaliação holística por categorias |
| 16 | Hábitos ruins (−XP) | Penalidade por hábitos negativos (opcional) |
| 17 | Daily Journal / Reflection | Notas longas de reflexão |
| 18 | Timetable (grade horária) | Rotina fixa seg–sex por slot de hora |
| 19 | Finance Tracker, Portfolio | Fora do escopo atual |
| 20 | Estética pixel art / RPG completo | Camada visual; independente das funcionalidades |

---

## Sistema de gamificação

### XP

| Fonte | Valor |
|-------|-------|
| Minuto estudado | +1 XP |
| Questão resolvida | +3 XP |
| Questão correta | +5 XP (adicional) |
| Simulado registrado | +50 XP |
| Meta diária atingida | +25 XP |
| Missões / conquistas | XP configurável por template |
| Quest concluída (V3) | XP configurável por quest (padrão: Alta 50, Média 30, Baixa 15) |
| Projeto concluído (V3) | XP bônus configurável (padrão 100) + auto-conclusão quando todas quests feitas |
| Hábito feito hoje (V3) | XP configurável por hábito (padrão 20); toggle desfaz e remove XP |
| Resgate na loja (V3) | Custo em XP definido pelo usuário; deduz saldo global |

### Níveis

Fórmula: XP para subir do nível N = `100 × N^1.5`. Aplica-se ao perfil global e a cada disciplina.

### Streak

Atualizado quando a meta diária de minutos é atingida. Recalculado ao abrir o app (`refreshStreakOnLoad`).

### Missões (templates seed)

- Diária: 30 min de estudo, 10 questões
- Semanal: 5 h de estudo, 100 questões

### Conquistas (exemplos)

Streaks (7/30/100 dias), marcos de questões (100–5000), marcos de horas (10–500 h).

### Celebrações (V2)

Eventos: `level_up`, `discipline_level_up`, `daily_goal`, `mission_complete`, `achievement_unlocked`, `quest`.  
Componentes: `CelebrationProvider`, `CelebrationToast`, `LevelUpModal`.

### Check-in diário

Modal na abertura (se habilitado e ainda não feito hoje). Gera texto de missão do dia; completar registra no `DailyCheckIn`.

---

## Módulos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `lib/gamification/engine.ts` | `recordStudyMinutes`, `recordQuestions`, orquestra XP/missões/streak/conquistas |
| `stores/studyStore.ts` | Cronômetro em tempo real; persiste a cada minuto via `pauseSession` |
| `lib/db/repositories/lifeAreas.ts` | **V3** — CRUD de áreas, stats, vínculo de disciplinas |
| `lib/db/repositories/quests.ts` | **V3** — CRUD de quests, filtros e contadores |
| `lib/db/repositories/projects.ts` | **V3** — CRUD de projetos, stats de quests, auto-sync de status |
| `lib/db/repositories/habits.ts` | **V3** — CRUD de hábitos, logs diários, stats e heat map |
| `lib/db/repositories/rewards.ts` | **V3** — CRUD de recompensas, resgates e histórico |
| `lib/gamification/habitStreaks.ts` | Cálculo de streak e grade temporal para hábitos |
| `components/habits/HabitHeatMap.tsx` | Grade estilo GitHub (12 semanas) |
| `lib/dates/timeProgress.ts` | **V3** — Cálculo de % decorrido (semana, mês, ano) |
| `components/dashboard/TimeProgressBars.tsx` | **V3** — Widget de barras temporais no dashboard |
| `lib/db/repositories/*.ts` | CRUD por domínio (sessions, disciplines, editals, activity, etc.) |
| `lib/life-area-icons.ts` | Ícones e cores preset para áreas da vida |
| `lib/projections/futureSelf.ts` | Média móvel 30 dias → projeção até data do edital/alvo |
| `lib/reports/weekly.ts` | Comparativo semanal |
| `components/knowledge/SkillTreeView.tsx` | Árvore SVG com cores por taxa de acerto |
| `lib/backup.ts` | Export do `sigma.db` via dialog nativo |

---

## Comandos de desenvolvimento

```bash
npm install
npx prisma generate
npm run tauri:dev      # App completo (recomendado)
npm run dev            # Só UI, sem SQLite
npm run tauri:build    # Instalador Windows (.msi)
npm run db:push        # Sync schema Prisma → SQLite local
npm run db:seed        # Seed via Prisma (dev)
```

**Windows:** scripts `tauri-with-rust.mjs` adicionam `%USERPROFILE%\.cargo\bin` ao PATH.

---

## O que já está pronto

**V1:** Dashboard, timer, XP/níveis, streak, check-in, missões, conquistas, histórico, Meu Futuro, export backup.

**V2:** Celebrações visuais, taxa de acerto por disciplina, skill tree SVG, feed de atividade, relatório semanal, múltiplos editais alvo.

**V3 (parcial):** Áreas da vida; Quests; Projetos; Hábitos com heat map e streaks.

---

## Limitações e backlog conhecido

Consulte `ROADMAP.md` para lista V1/V2. Destaques gerais:

- Backup **exporta** mas **não restaura** ainda
- Simulado é registro simples (+50 XP), sem banca/tempo/acertos detalhados
- Sem system tray, notificações nativas
- Sem integração com bancos de questões (QConcursos, TEC, etc.)
- Registro de questões é **manual** (quantidade + acertos)
- Tema escuro fixo na prática; campo `theme` existe mas UI não alterna
- Testes automatizados ausentes no motor de gamificação
- App single-user (sempre `UserProfile.id = 1`)

---

## Convenções de código

- Imports no topo do arquivo (sem inline imports)
- Switch exhaustivo com `never` em unions/enums TypeScript
- SQL direto no runtime; Prisma usado para schema e tipos em dev
- Componentes UI base em `src/components/ui/` (padrão Shadcn)
- Alias `@/` → `src/`
- Textos de UI em português; código/identificadores em inglês
- React Query: `staleTime` 30s; invalidação ampla (`queryClient.invalidateQueries()`) após mutações
- Slugify centralizado em `lib/utils.ts` (`slugify()`)

---

## Direção do produto

O Sigma evolui de **auxiliar de concurso** para **hub de estudos e produtividade gamificado**, mantendo:

1. Foco **local-first** (SQLite, sem backend obrigatório)
2. Simplicidade do fluxo de registro manual
3. Gamificação como motivador, não distração
4. Compatibilidade Tauri desktop (Windows prioritário)
5. Hierarquia: **Life Area → Project → Quest → Discipline**; gamificação em cada nível (V3+)

Implementação V3 segue ordem: Life Areas → Quests → Projects → Habits → Pomodoro → Reward Shop → Time Bars.

---

## Referências no repositório

- `README.md` — instalação e visão rápida
- `ROADMAP.md` — backlog V1/V2
- `prisma/schema.prisma` — schema canônico do banco
