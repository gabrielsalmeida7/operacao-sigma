# Roadmap — Operação Sigma

Sugestões de melhoria catalogadas para consulta e priorização futura.

**Legenda de status:** `v1` (entregue na V1) · `v2` (esta entrega) · `backlog` · `futuro`

---

## Experiência e motivação

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 1 | Ritual de fechamento do dia | backlog | Debriefing noturno: o que fez, taxa de acerto, o que melhorar amanhã |
| 2 | Celebrações visuais | **v2** | Toast e modal ao subir de nível, completar missão ou desbloquear conquista |
| 3 | Streak com proteção | backlog | 1 "dia de gelo" por mês ou alerta "streak em risco" |
| 4 | Árvore de conhecimento visual | **v2** | Skill tree com nós, conexões SVG e cores por desempenho |
| 5 | Modo Pomodoro | backlog | Ciclos 25/5 ou 50/10 além do cronômetro livre |

---

## Produtividade para concursos

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 6 | Registro de simulado completo | backlog | Banca, prova, acertos, tempo — além do +50 XP |
| 7 | Taxa de acerto por disciplina | **v2** | % por matéria na skill tree e dashboard |
| 8 | Edital / concurso alvo | **v2** | Múltiplos editais com data, órgão e disciplinas vinculadas |
| 9 | Planner semanal | backlog | Planejamento por dia da semana e disciplina |
| 10 | Integração com bancos de questões | futuro | Import CSV ou API (QConcursos, TEC, etc.) |

---

## Dashboard e dados

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 11 | Feed de atividade | **v2** | Timeline: sessões, questões, XP, conquistas |
| 12 | Relatório semanal automático | **v2** | Comparativo semana atual vs anterior |
| 13 | Projeções mais inteligentes | backlog | Cenários "se estudar 1h/2h", ponderar dias úteis |
| 14 | Gráfico de XP e nível ao longo do tempo | backlog | Evolução de nível no histórico |

---

## App desktop (Tauri)

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 15 | Ícone e identidade visual | backlog | Ícone Sigma customizado (escudo/radar) |
| 16 | Bandeja do sistema (system tray) | futuro | Timer com app minimizado |
| 17 | Notificações nativas | futuro | Meta diária, streak em risco, missão quase completa |
| 18 | Backup/restauração completa | v1 | Exportar backup (restauração = backlog) |
| 19 | Botão "Abrir pasta dos dados" | backlog | Atalho para `sigma.db` em AppData |
| 20 | Fontes offline | backlog | Embutir Inter/JetBrains sem CDN |

---

## Gamificação avançada

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 21 | Missões personalizáveis | backlog | Criar missões próprias além dos templates |
| 22 | Títulos / patentes por nível | backlog | "Agente Especial", "Perito em Formação" |
| 23 | Desafios mensais | backlog | Meta macro do mês (ex: 40h em março) |
| 24 | Ranking expandido | v1 | Comparativo mensal (expandir com taxa de acerto) |

---

## Inteligência artificial

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 25 | Briefing matinal | futuro | Sugestão do que estudar com base em histórico |
| 26 | Análise do debriefing | futuro | Padrões no texto livre do check-in |
| 27 | Gerador de missões | futuro | IA sugere missão do dia baseada no edital |

---

## Técnico / qualidade

| # | Sugestão | Status | Descrição |
|---|----------|--------|-----------|
| 28 | Testes no motor de gamificação | backlog | Unit tests: XP, streak, virada de dia |
| 29 | Migrações versionadas | backlog | `schema_version` para evolução segura do DB |
| 30 | Atalhos de teclado | backlog | Space pausar timer, atalhos de registro |

---

## Entregas por versão

### V1 (concluída)
Dashboard, timer, XP/níveis, streak, check-in, missões, conquistas, árvore (cards), histórico, Meu Futuro, backup export.

### V2 (atual)
Celebrações, taxa de acerto, relatório semanal, editais múltiplos, feed de atividade, skill tree visual.

### Próximas prioridades sugeridas
1. Restauração de backup
2. Simulado completo
3. System tray + notificações
4. Integração bancos de questões
