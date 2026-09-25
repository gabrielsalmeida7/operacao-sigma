import { useState, useEffect } from "react";
import { getTodayCheckIn } from "@/lib/db/repositories/checkin";
import { getSettings } from "@/lib/db/repositories/settings";
import type { DailyCheckIn } from "@/lib/db/types";

export function useDailyCheckIn() {
  const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [today, settings] = await Promise.all([getTodayCheckIn(), getSettings()]);
      setCheckIn(today);
      setShouldShow(settings.checkInEnabled && !today);
      setLoading(false);
    }
    load();
  }, []);

  const dismiss = () => setShouldShow(false);

  const refresh = async () => {
    const today = await getTodayCheckIn();
    setCheckIn(today);
    setShouldShow(false);
  };

  return { checkIn, shouldShow, loading, dismiss, refresh, setCheckIn };
}
