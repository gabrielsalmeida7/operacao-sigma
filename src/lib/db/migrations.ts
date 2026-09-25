export const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS UserProfile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'Operador',
    dailyGoalMin INTEGER NOT NULL DEFAULT 60,
    totalXp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    currentStreak INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    lastStreakDate TEXT,
    totalStudyMin INTEGER NOT NULL DEFAULT 0,
    totalQuestions INTEGER NOT NULL DEFAULT 0,
    totalCorrect INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS AppSettings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    theme TEXT NOT NULL DEFAULT 'dark',
    checkInEnabled INTEGER NOT NULL DEFAULT 1,
    futureTargetDate TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS Discipline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS StudySession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startedAt TEXT NOT NULL,
    endedAt TEXT,
    durationSec INTEGER NOT NULL DEFAULT 0,
    disciplineId INTEGER,
    isActive INTEGER NOT NULL DEFAULT 0,
    xpEarned INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS QuestionLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resolvedCount INTEGER NOT NULL,
    correctCount INTEGER NOT NULL,
    disciplineId INTEGER,
    sessionId INTEGER,
    isSimulado INTEGER NOT NULL DEFAULT 0,
    xpEarned INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS DailyCheckIn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    missionText TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS XpEvent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL,
    metadataJson TEXT NOT NULL DEFAULT '{}',
    disciplineId INTEGER,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Achievement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    xpReward INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS UserAchievement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievementId INTEGER NOT NULL UNIQUE,
    unlockedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS MissionTemplate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    target INTEGER NOT NULL,
    unit TEXT NOT NULL,
    xpReward INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS MissionProgress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    templateId INTEGER NOT NULL,
    periodKey TEXT NOT NULL,
    current INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    rewarded INTEGER NOT NULL DEFAULT 0,
    UNIQUE(templateId, periodKey)
  )`,
  `CREATE TABLE IF NOT EXISTS MonthlySnapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    studyMinutes INTEGER NOT NULL DEFAULT 0,
    questionsResolved INTEGER NOT NULL DEFAULT 0,
    xpEarned INTEGER NOT NULL DEFAULT 0,
    UNIQUE(year, month)
  )`,
  `CREATE TABLE IF NOT EXISTS DailyStats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    studyMinutes INTEGER NOT NULL DEFAULT 0,
    questionsResolved INTEGER NOT NULL DEFAULT 0,
    questionsCorrect INTEGER NOT NULL DEFAULT 0,
    xpEarned INTEGER NOT NULL DEFAULT 0,
    goalMet INTEGER NOT NULL DEFAULT 0
  )`,
  // v2 migrations
  `ALTER TABLE Discipline ADD COLUMN totalResolved INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Discipline ADD COLUMN totalCorrect INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS TargetEdital (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organ TEXT,
    examDate TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS EditalDiscipline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    editalId INTEGER NOT NULL,
    disciplineId INTEGER NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    UNIQUE(editalId, disciplineId)
  )`,
  `ALTER TABLE AppSettings ADD COLUMN selectedEditalId INTEGER`,
  // v3 — life areas
  `CREATE TABLE IF NOT EXISTS LifeArea (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT NOT NULL DEFAULT 'layers',
    sortOrder INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
  )`,
  `ALTER TABLE Discipline ADD COLUMN lifeAreaId INTEGER`,
  // v3 — user quests
  `CREATE TABLE IF NOT EXISTS Quest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    lifeAreaId INTEGER,
    disciplineId INTEGER,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    xpReward INTEGER NOT NULL DEFAULT 30,
    dueDate TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  // v3 — projects (missions / metas maiores)
  `CREATE TABLE IF NOT EXISTS Project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    lifeAreaId INTEGER,
    disciplineId INTEGER,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    xpReward INTEGER NOT NULL DEFAULT 100,
    dueDate TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `ALTER TABLE Quest ADD COLUMN projectId INTEGER`,
  // v3 — habits
  `CREATE TABLE IF NOT EXISTS Habit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    lifeAreaId INTEGER,
    xpReward INTEGER NOT NULL DEFAULT 20,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS HabitLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitId INTEGER NOT NULL,
    date TEXT NOT NULL,
    xpEarned INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    UNIQUE(habitId, date)
  )`,
  // v3 — reward shop
  `CREATE TABLE IF NOT EXISTS Reward (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    xpCost INTEGER NOT NULL DEFAULT 100,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS RewardRedemption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rewardId INTEGER,
    title TEXT NOT NULL,
    xpSpent INTEGER NOT NULL,
    redeemedAt TEXT NOT NULL
  )`,
  // v4 — study cycles
  `ALTER TABLE Discipline ADD COLUMN studyPriority TEXT NOT NULL DEFAULT 'MEDIUM'`,
  `ALTER TABLE Discipline ADD COLUMN studyPhase TEXT NOT NULL DEFAULT 'PDF'`,
  `ALTER TABLE Discipline ADD COLUMN blockMinutes INTEGER NOT NULL DEFAULT 60`,
  `ALTER TABLE Discipline ADD COLUMN pdfsTotal INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Discipline ADD COLUMN pdfsCurrent INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Discipline ADD COLUMN isInCycle INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE Discipline ADD COLUMN targetAccuracyPercent INTEGER`,
  `ALTER TABLE QuestionLog ADD COLUMN topicId INTEGER`,
  `ALTER TABLE QuestionLog ADD COLUMN segment INTEGER`,
  `ALTER TABLE QuestionLog ADD COLUMN phase TEXT`,
  `CREATE TABLE IF NOT EXISTS StudyCycle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    editalId INTEGER,
    dayCount INTEGER NOT NULL DEFAULT 8,
    blocksPerDay INTEGER NOT NULL DEFAULT 3,
    currentBlockNumber INTEGER NOT NULL DEFAULT 1,
    studyWeekdaysJson TEXT NOT NULL DEFAULT '{}',
    reviewDaySlotsJson TEXT NOT NULL DEFAULT '[3,5,8]',
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS StudyCycleBlock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycleId INTEGER NOT NULL,
    blockNumber INTEGER NOT NULL,
    dayNumber INTEGER NOT NULL,
    slotInDay INTEGER NOT NULL,
    blockType TEXT NOT NULL DEFAULT 'DISCIPLINE',
    disciplineId INTEGER,
    isManualOverride INTEGER NOT NULL DEFAULT 0,
    UNIQUE(cycleId, blockNumber)
  )`,
  `CREATE TABLE IF NOT EXISTS DisciplineTopic (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disciplineId INTEGER NOT NULL,
    lessonCode TEXT NOT NULL DEFAULT '00',
    name TEXT NOT NULL,
    referenceUrl TEXT,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    weight INTEGER NOT NULL DEFAULT 1,
    totalQuestionsAvailable INTEGER NOT NULL DEFAULT 0,
    targetAccuracyPercent INTEGER,
    totalResolved INTEGER NOT NULL DEFAULT 0,
    totalCorrect INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS TopicSegmentProgress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topicId INTEGER NOT NULL,
    segment INTEGER NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    UNIQUE(topicId, segment)
  )`,
  `CREATE TABLE IF NOT EXISTS StudyActivityLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disciplineId INTEGER NOT NULL,
    topicId INTEGER,
    phase TEXT NOT NULL,
    reference TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    correctCount INTEGER NOT NULL DEFAULT 0,
    isFinished INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  // v5 — ciclo rotativo ATRF
  `ALTER TABLE Discipline ADD COLUMN cycleRole TEXT NOT NULL DEFAULT 'BASE'`,
  `ALTER TABLE Discipline ADD COLUMN cycleState TEXT NOT NULL DEFAULT 'ACTIVE'`,
  `ALTER TABLE Discipline ADD COLUMN weightPercent INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Discipline ADD COLUMN cognitiveGroup TEXT NOT NULL DEFAULT 'LAW'`,
  `ALTER TABLE Discipline ADD COLUMN unlockAfterSlug TEXT`,
  `ALTER TABLE Discipline ADD COLUMN theoryComplete INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Discipline ADD COLUMN cycleSortOrder INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE StudyCycle ADD COLUMN weeklySessions INTEGER NOT NULL DEFAULT 12`,
  `ALTER TABLE StudyCycle ADD COLUMN sessionMinutes INTEGER NOT NULL DEFAULT 50`,
  `ALTER TABLE StudyCycle ADD COLUMN currentLap INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE StudyCycle ADD COLUMN weekColorIndex INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE StudyCycleBlock ADD COLUMN thematicFocus TEXT`,
  `ALTER TABLE StudyCycleBlock ADD COLUMN studyHint TEXT`,
  `ALTER TABLE DisciplineTopic ADD COLUMN topicStatus TEXT NOT NULL DEFAULT 'IN_PROGRESS'`,
  `ALTER TABLE DisciplineTopic ADD COLUMN lastAccuracyPercent INTEGER`,
  `CREATE TABLE IF NOT EXISTS StudyCycleCompletion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycleId INTEGER NOT NULL,
    blockNumber INTEGER NOT NULL,
    lap INTEGER NOT NULL,
    weekColor TEXT NOT NULL,
    completedAt TEXT NOT NULL,
    UNIQUE(cycleId, blockNumber, lap)
  )`,
  // v6 — bookmark "onde parei" por matéria
  `ALTER TABLE Discipline ADD COLUMN bookmarkLessonCode TEXT`,
  `ALTER TABLE Discipline ADD COLUMN bookmarkPdfName TEXT`,
  `ALTER TABLE Discipline ADD COLUMN bookmarkNote TEXT`,
];
