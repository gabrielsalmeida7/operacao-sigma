# Operação Sigma

Sistema desktop gamificado para estudos de concursos — XP, níveis, streaks, missões, conquistas e projeções de futuro.

## Stack

- **Desktop:** Tauri 2
- **Frontend:** React + TypeScript + Vite
- **UI:** TailwindCSS + Shadcn/UI
- **Banco:** SQLite (`@tauri-apps/plugin-sql`)
- **Schema:** Prisma (migrations e tipos em dev)

## Pré-requisitos

1. [Node.js](https://nodejs.org/) 20+
2. [Rust](https://www.rust-lang.org/tools/install) (para build desktop)
3. [Tauri prerequisites (Windows)](https://tauri.app/start/prerequisites/)

## Instalação

```bash
cd Sigma
npm install
npx prisma generate
```

## Desenvolvimento

```bash
npm run tauri:dev
```

Na **primeira execução**, o Rust compila ~400 crates — pode levar **5–15 minutos**. As próximas abrem bem mais rápido.

Apenas frontend (sem Tauri):

```bash
npm run dev
```

> O banco SQLite só funciona dentro do app Tauri. O modo `npm run dev` exibe a interface, mas persistência requer `tauri:dev`.

### Erro `cargo metadata: program not found`

O Rust está instalado, mas o terminal não encontra o `cargo` no PATH. Opções:

1. **Reinicie o Cursor/terminal** após instalar o Rust (recomendado).
2. Use os scripts do projeto (`npm run tauri:dev`) — eles adicionam `%USERPROFILE%\.cargo\bin` ao PATH automaticamente.
3. Adicione manualmente ao PATH do Windows: `%USERPROFILE%\.cargo\bin`

## Build de produção

```bash
npm run build        # Frontend
npm run tauri:build  # Instalador Windows (.msi via NSIS)
```

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run db:push` | Sincroniza schema Prisma com SQLite local |
| `npm run db:seed` | Popula conquistas, missões e disciplinas |

## Funcionalidades

### V1
- Dashboard com nível, XP, streak e meta diária
- Timer de estudo com persistência
- Registro manual de questões e simulados
- Check-in diário com missão do dia
- Missões diárias/semanais com recompensas
- Conquistas automáticas
- Histórico mensal com gráficos
- Tela "Meu Futuro" com projeções
- Exportação de backup do banco

### V2
- Celebrações (level-up, conquistas, missões, meta diária)
- Taxa de acerto por disciplina
- Skill tree visual com cores por desempenho
- Feed de atividade (timeline)
- Relatório semanal comparativo
- Múltiplos editais alvo com disciplinas vinculadas

Ver [ROADMAP.md](ROADMAP.md) para melhorias futuras.
