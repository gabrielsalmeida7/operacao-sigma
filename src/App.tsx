import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { DailyCheckInModal } from "@/components/checkin/DailyCheckInModal";
import { CelebrationProvider } from "@/components/celebrations/CelebrationProvider";
import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import { getDb } from "@/lib/db/client";
import { refreshStreakOnLoad } from "@/lib/gamification/engine";
import { Dashboard } from "@/routes/Dashboard";
import { Study } from "@/routes/Study";
import { Missions } from "@/routes/Missions";
import { Achievements } from "@/routes/Achievements";
import { KnowledgeTree } from "@/routes/KnowledgeTree";
import { History } from "@/routes/History";
import { FutureSelf } from "@/routes/FutureSelf";
import { Settings } from "@/routes/Settings";
import { WeeklyReport } from "@/routes/WeeklyReport";
import { Editals } from "@/routes/Editals";
import { Activity } from "@/routes/Activity";
import { LifeAreas } from "@/routes/LifeAreas";
import { Quests } from "@/routes/Quests";
import { Projects } from "@/routes/Projects";
import { Habits } from "@/routes/Habits";
import { Rewards } from "@/routes/Rewards";
import { StudyCycles } from "@/routes/StudyCycles";
import { CycleGuide } from "@/routes/CycleGuide";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function AppContent() {
  const { shouldShow, loading, refresh } = useDailyCheckIn();

  useEffect(() => {
    getDb().then(() => refreshStreakOnLoad());
  }, []);

  return (
    <CelebrationProvider>
      <DailyCheckInModal open={!loading && shouldShow} onComplete={refresh} />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study" element={<Study />} />
          <Route path="/cycles" element={<StudyCycles />} />
          <Route path="/cycle-guide" element={<CycleGuide />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/knowledge" element={<KnowledgeTree />} />
          <Route path="/history" element={<History />} />
          <Route path="/weekly" element={<WeeklyReport />} />
          <Route path="/editals" element={<Editals />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/life-areas" element={<LifeAreas />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/future" element={<FutureSelf />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </CelebrationProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
