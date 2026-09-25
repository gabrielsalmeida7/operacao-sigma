import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const achievements = [
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

const missions = [
  { code: "daily_study_30", type: "DAILY", title: "Estudar 30 min", target: 30, unit: "minutes", xpReward: 15 },
  { code: "daily_questions_10", type: "DAILY", title: "Resolver 10 questões", target: 10, unit: "questions", xpReward: 15 },
  { code: "weekly_study_300", type: "WEEKLY", title: "Estudar 5 horas", target: 300, unit: "minutes", xpReward: 75 },
  { code: "weekly_questions_100", type: "WEEKLY", title: "Resolver 100 questões", target: 100, unit: "questions", xpReward: 75 },
];

const disciplines = [
  { name: "Direito Constitucional", slug: "direito-constitucional" },
  { name: "Direito Administrativo", slug: "direito-administrativo" },
  { name: "Informática", slug: "informatica" },
  { name: "Português", slug: "portugues" },
  { name: "Raciocínio Lógico", slug: "raciocinio-logico" },
];

async function main() {
  const now = new Date().toISOString();
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  await prisma.userProfile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Operador", createdAt: now, updatedAt: now },
  });

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, futureTargetDate: yearEnd },
  });

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: a,
      create: a,
    });
  }

  for (const m of missions) {
    await prisma.missionTemplate.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }

  for (const d of disciplines) {
    await prisma.discipline.upsert({
      where: { slug: d.slug },
      update: { name: d.name },
      create: { ...d, createdAt: now },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
