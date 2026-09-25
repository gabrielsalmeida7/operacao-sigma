import type Database from "@tauri-apps/plugin-sql";
import { defaultFutureTargetDate, nowIso } from "@/lib/dates";
import { ATRF_CATALOG } from "@/lib/study-cycles/atrfCatalog";

const ACHIEVEMENTS = [
  { code: "first_day", title: "Primeiro Dia", category: "consistency", threshold: 1, xpReward: 10 },
  { code: "streak_7", title: "7 Dias Seguidos", category: "consistency", threshold: 7, xpReward: 50 },
  { code: "streak_30", title: "30 Dias Seguidos", category: "consistency", threshold: 30, xpReward: 200 },
  { code: "streak_100", title: "100 Dias Seguidos", category: "consistency", threshold: 100, xpReward: 500 },
  { code: "questions_100", title: "100 Questões", category: "questions", threshold: 100, xpReward: 30 },
  { code: "questions_500", title: "500 Questões", category: "questions", threshold: 500, xpReward: 100 },
  { code: "questions_1000", title: "1000 Questões", category: "questions", threshold: 1000, xpReward: 250 },
  { code: "questions_5000", title: "5000 Questões", category: "questions", threshold: 5000, xpReward: 1000 },
  { code: "hours_10", title: "10 Horas", category: "hours", threshold: 600, xpReward: 30 },
  { code: "hours_50", title: "50 Horas", category: "hours", threshold: 3000, xpReward: 150 },
  { code: "hours_100", title: "100 Horas", category: "hours", threshold: 6000, xpReward: 300 },
  { code: "hours_500", title: "500 Horas", category: "hours", threshold: 30000, xpReward: 1500 },
];

const MISSIONS = [
  { code: "daily_study_30", type: "DAILY", title: "Estudar 30 min", target: 30, unit: "minutes", xpReward: 15 },
  { code: "daily_questions_10", type: "DAILY", title: "Resolver 10 questões", target: 10, unit: "questions", xpReward: 15 },
  { code: "weekly_study_300", type: "WEEKLY", title: "Estudar 5 horas", target: 300, unit: "minutes", xpReward: 75 },
  { code: "weekly_questions_100", type: "WEEKLY", title: "Resolver 100 questões", target: 100, unit: "questions", xpReward: 75 },
];

const LIFE_AREAS = [
  {
    name: "Concurso",
    slug: "concurso",
    description: "Estudos para concursos públicos",
    color: "#6366f1",
    icon: "graduation-cap",
    sortOrder: 0,
  },
  {
    name: "Programação",
    slug: "programacao",
    description: "Desenvolvimento e tecnologia",
    color: "#22c55e",
    icon: "code",
    sortOrder: 1,
  },
  {
    name: "Saúde",
    slug: "saude",
    description: "Exercícios, sono e bem-estar",
    color: "#ef4444",
    icon: "heart",
    sortOrder: 2,
  },
  {
    name: "Desenvolvimento Pessoal",
    slug: "desenvolvimento-pessoal",
    description: "Leitura, idiomas e crescimento",
    color: "#f59e0b",
    icon: "sparkles",
    sortOrder: 3,
  },
];

const REWARDS = [
  {
    title: "Pausa de 15 min no celular",
    description: "Scroll liberado, sem culpa — timer de 15 minutos.",
    xpCost: 50,
  },
  {
    title: "Café ou lanche especial",
    description: "Capricho na padaria ou cafeteria favorita.",
    xpCost: 75,
  },
  {
    title: "1 episódio de série",
    description: "Um episódio de qualquer série, depois de fechar o material.",
    xpCost: 100,
  },
  {
    title: "30 min de videogame",
    description: "Meia hora de jogo sem pensar em edital.",
    xpCost: 150,
  },
  {
    title: "Pedir delivery favorito",
    description: "Comida que você ama, sem cozinhar hoje.",
    xpCost: 200,
  },
  {
    title: "Sessão de cinema em casa",
    description: "Filme completo com pipoca ou doce.",
    xpCost: 250,
  },
  {
    title: "Compra pequena (até R$ 30)",
    description: "Algo que você queria há tempo — livro, skin, acessório.",
    xpCost: 300,
  },
  {
    title: "Tarde livre sem estudar",
    description: "Resto do dia off: zero PDF, zero questões.",
    xpCost: 500,
  },
  {
    title: "Jantar fora",
    description: "Restaurante ou lanchonete com alguém ou solo date.",
    xpCost: 600,
  },
  {
    title: "Grande recompensa personalizada",
    description: "Algo especial que você definir — viagem curta, gadget, etc.",
    xpCost: 1500,
  },
];

export async function seedDatabase(db: Database): Promise<void> {
  const now = nowIso();
  const profiles = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM UserProfile");
  if ((profiles[0]?.count ?? 0) === 0) {
    await db.execute(
      "INSERT INTO UserProfile (id, name, dailyGoalMin, createdAt, updatedAt) VALUES (1, ?, 60, ?, ?)",
      ["Operador", now, now],
    );
  }

  const settings = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM AppSettings");
  if ((settings[0]?.count ?? 0) === 0) {
    await db.execute(
      "INSERT INTO AppSettings (id, futureTargetDate) VALUES (1, ?)",
      [defaultFutureTargetDate()],
    );
  }

  for (const a of ACHIEVEMENTS) {
    await db.execute(
      `INSERT OR IGNORE INTO Achievement (code, title, category, threshold, xpReward)
       VALUES (?, ?, ?, ?, ?)`,
      [a.code, a.title, a.category, a.threshold, a.xpReward],
    );
  }

  for (const m of MISSIONS) {
    await db.execute(
      `INSERT OR IGNORE INTO MissionTemplate (code, type, title, target, unit, xpReward)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.code, m.type, m.title, m.target, m.unit, m.xpReward],
    );
  }

  for (const area of LIFE_AREAS) {
    await db.execute(
      `INSERT OR IGNORE INTO LifeArea (name, slug, description, color, icon, sortOrder, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [area.name, area.slug, area.description, area.color, area.icon, area.sortOrder, now],
    );
  }

  for (const d of ATRF_CATALOG) {
    await db.execute(
      `INSERT OR IGNORE INTO Discipline
       (name, slug, cycleRole, cycleState, weightPercent, cognitiveGroup, unlockAfterSlug,
        cycleSortOrder, isInCycle, studyPriority, blockMinutes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.name,
        d.slug,
        d.cycleRole,
        d.cycleState,
        d.weightPercent,
        d.cognitiveGroup,
        d.unlockAfterSlug,
        d.cycleSortOrder,
        d.isInCycle ? 1 : 0,
        d.studyPriority,
        d.blockMinutes,
        now,
      ],
    );
  }

  const rewardCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM Reward");
  if ((rewardCount[0]?.count ?? 0) === 0) {
    for (const reward of REWARDS) {
      await db.execute(
        `INSERT INTO Reward (title, description, xpCost, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [reward.title, reward.description, reward.xpCost, now, now],
      );
    }
  }
}
