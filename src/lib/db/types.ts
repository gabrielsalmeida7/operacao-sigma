export interface UserProfile {
  id: number;
  name: string;
  dailyGoalMin: number;
  totalXp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastStreakDate: string | null;
  totalStudyMin: number;
  totalQuestions: number;
  totalCorrect: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: number;
  theme: string;
  checkInEnabled: boolean;
  futureTargetDate: string;
  selectedEditalId: number | null;
}

export type QuestPriority = "HIGH" | "MEDIUM" | "LOW";
export type QuestStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export interface Habit {
  id: number;
  title: string;
  description: string | null;
  lifeAreaId: number | null;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: number;
  habitId: number;
  date: string;
  xpEarned: number;
  createdAt: string;
}

export interface HabitHeatMapDay {
  date: string;
  completed: boolean;
}

export interface HabitWithStats extends Habit {
  lifeAreaName: string | null;
  lifeAreaColor: string | null;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  heatMap: HabitHeatMapDay[];
  completionsThisWeek: number;
}

export interface Reward {
  id: number;
  title: string;
  description: string | null;
  xpCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardWithStats extends Reward {
  timesRedeemed: number;
}

export interface RewardRedemption {
  id: number;
  rewardId: number | null;
  title: string;
  xpSpent: number;
  redeemedAt: string;
}

export type ProjectStatus = QuestStatus;

export interface Project {
  id: number;
  title: string;
  description: string | null;
  lifeAreaId: number | null;
  disciplineId: number | null;
  priority: QuestPriority;
  status: ProjectStatus;
  xpReward: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectQuestStats {
  total: number;
  completed: number;
  inProgress: number;
  progressPercent: number;
}

export interface ProjectWithDetails extends Project {
  lifeAreaName: string | null;
  lifeAreaColor: string | null;
  disciplineName: string | null;
  isOverdue: boolean;
  daysRemaining: number | null;
  questStats: ProjectQuestStats;
}

export interface Quest {
  id: number;
  title: string;
  description: string | null;
  lifeAreaId: number | null;
  disciplineId: number | null;
  projectId: number | null;
  priority: QuestPriority;
  status: QuestStatus;
  xpReward: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestWithDetails extends Quest {
  lifeAreaName: string | null;
  lifeAreaColor: string | null;
  disciplineName: string | null;
  projectTitle: string | null;
  isOverdue: boolean;
  isDueToday: boolean;
}

export interface LifeArea {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface LifeAreaWithStats extends LifeArea {
  disciplineCount: number;
  totalXp: number;
  weeklyStudyMinutes: number;
}

export type StudyPriority = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";
export type StudyPhase = "PDF" | "QUESTIONS";
export type CycleBlockType = "DISCIPLINE" | "REVIEW" | "MIXED";
export type CycleRole = "BASE" | "SPECIFIC" | "FINAL";
export type CycleState = "ACTIVE" | "MAINTENANCE" | "LOCKED";
export type CognitiveGroup = "LAW" | "EXACT" | "LANGUAGE";
export type TopicStudyStatus = "IN_PROGRESS" | "COMPLETED" | "MANDATORY_REVIEW";
export type TqrPhase = "current_review" | "error_review" | "theory" | "questions";

export interface Discipline {
  id: number;
  name: string;
  slug: string;
  xp: number;
  level: number;
  totalResolved: number;
  totalCorrect: number;
  lifeAreaId: number | null;
  studyPriority: StudyPriority;
  studyPhase: StudyPhase;
  blockMinutes: number;
  pdfsTotal: number;
  pdfsCurrent: number;
  isInCycle: boolean;
  targetAccuracyPercent: number | null;
  cycleRole: CycleRole;
  cycleState: CycleState;
  weightPercent: number;
  cognitiveGroup: CognitiveGroup;
  unlockAfterSlug: string | null;
  theoryComplete: boolean;
  cycleSortOrder: number;
  bookmarkLessonCode: string | null;
  bookmarkPdfName: string | null;
  bookmarkNote: string | null;
  createdAt: string;
}

export interface StudyCycle {
  id: number;
  name: string;
  editalId: number | null;
  dayCount: number;
  blocksPerDay: number;
  currentBlockNumber: number;
  studyWeekdaysJson: string;
  studyWeekdays: Record<string, string>;
  reviewDaySlotsJson: string;
  reviewDaySlots: number[];
  weeklySessions: number;
  sessionMinutes: number;
  currentLap: number;
  weekColorIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyCycleBlock {
  id: number;
  cycleId: number;
  blockNumber: number;
  dayNumber: number;
  slotInDay: number;
  blockType: CycleBlockType;
  disciplineId: number | null;
  isManualOverride: boolean;
  thematicFocus: string | null;
  studyHint: string | null;
}

export interface StudyCycleBlockWithDiscipline extends StudyCycleBlock {
  disciplineName: string | null;
  disciplinePriority: StudyPriority | null;
  disciplineSlug: string | null;
}

export interface StudyCycleCompletion {
  id: number;
  cycleId: number;
  blockNumber: number;
  lap: number;
  weekColor: string;
  completedAt: string;
}

export interface DisciplineTopic {
  id: number;
  disciplineId: number;
  lessonCode: string;
  name: string;
  referenceUrl: string | null;
  sortOrder: number;
  weight: number;
  totalQuestionsAvailable: number;
  targetAccuracyPercent: number | null;
  totalResolved: number;
  totalCorrect: number;
  topicStatus: TopicStudyStatus;
  lastAccuracyPercent: number | null;
  createdAt: string;
}

export interface TopicSegmentProgress {
  id: number;
  topicId: number;
  segment: number;
  resolved: number;
  correct: number;
}

export interface TopicWithSegments extends DisciplineTopic {
  segments: TopicSegmentProgress[];
  totalResolvedAll: number;
  totalCorrectAll: number;
  accuracyPercent: number | null;
  meetsTarget: boolean;
}

export interface StudyActivityLog {
  id: number;
  disciplineId: number;
  topicId: number | null;
  phase: StudyPhase;
  reference: string;
  date: string;
  quantity: number;
  correctCount: number;
  isFinished: boolean;
  createdAt: string;
}

export interface StudyActivityLogWithNames extends StudyActivityLog {
  disciplineName: string;
  topicName: string | null;
}

export interface CycleStatus {
  nextSubject: string;
  nextItem: string;
  whereStopped: string;
  currentBlock: StudyCycleBlockWithDiscipline | null;
  totalBlocks: number;
  mandatoryReview: boolean;
  previousTopicName: string | null;
  thematicFocus: string | null;
  studyHint: string | null;
}

export interface DisciplineCycleRow extends Discipline {
  pdfProgressPercent: number | null;
  accuracyPercent: number | null;
}

export interface TargetEdital {
  id: number;
  name: string;
  organ: string | null;
  examDate: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export interface EditalDiscipline {
  id: number;
  editalId: number;
  disciplineId: number;
  weight: number;
}

export interface DisciplineAccuracy {
  resolved: number;
  correct: number;
  percent: number | null;
}

export interface ActivityItem {
  id: string;
  type: "study" | "questions" | "simulado" | "xp" | "achievement" | "mission" | "quest" | "project" | "habit" | "daily_goal" | "pomodoro" | "reward";
  title: string;
  subtitle?: string;
  xp?: number;
  createdAt: string;
  disciplineName?: string;
}

export interface StudySession {
  id: number;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  disciplineId: number | null;
  isActive: boolean;
  xpEarned: number;
}

export interface QuestionLog {
  id: number;
  resolvedCount: number;
  correctCount: number;
  disciplineId: number | null;
  topicId: number | null;
  segment: number | null;
  phase: StudyPhase | null;
  sessionId: number | null;
  isSimulado: boolean;
  xpEarned: number;
  createdAt: string;
}

export interface DailyCheckIn {
  id: number;
  date: string;
  missionText: string;
  completed: boolean;
  createdAt: string;
}

export interface XpEvent {
  id: number;
  source: string;
  amount: number;
  metadataJson: string;
  disciplineId: number | null;
  createdAt: string;
}

export interface Achievement {
  id: number;
  code: string;
  title: string;
  category: string;
  threshold: number;
  xpReward: number;
}

export interface UserAchievement {
  id: number;
  achievementId: number;
  unlockedAt: string;
}

export interface MissionTemplate {
  id: number;
  code: string;
  type: "DAILY" | "WEEKLY";
  title: string;
  target: number;
  unit: string;
  xpReward: number;
}

export interface MissionProgress {
  id: number;
  templateId: number;
  periodKey: string;
  current: number;
  completed: boolean;
  rewarded: boolean;
}

export interface MonthlySnapshot {
  id: number;
  year: number;
  month: number;
  studyMinutes: number;
  questionsResolved: number;
  xpEarned: number;
}

export interface DailyStats {
  id: number;
  date: string;
  studyMinutes: number;
  questionsResolved: number;
  questionsCorrect: number;
  xpEarned: number;
  goalMet: boolean;
}

export interface DashboardData {
  profile: UserProfile;
  todayMinutes: number;
  todayXp: number;
  levelProgress: { current: number; required: number; percent: number };
  activeSession: StudySession | null;
  todayCheckIn: DailyCheckIn | null;
}
