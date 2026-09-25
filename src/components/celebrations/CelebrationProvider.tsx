import { useEffect, useState, useCallback } from "react";
import { useCelebrationStore } from "@/stores/celebrationStore";
import type { CelebrationEvent } from "@/lib/gamification/events";
import { LevelUpModal } from "./LevelUpModal";
import { CelebrationToast } from "./CelebrationToast";

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { queue, shiftEvent } = useCelebrationStore();
  const [current, setCurrent] = useState<CelebrationEvent | null>(null);
  const [toast, setToast] = useState<CelebrationEvent | null>(null);

  const processNext = useCallback(() => {
    const event = shiftEvent();
    if (!event) {
      setCurrent(null);
      return;
    }
    if (event.type === "level_up") {
      setCurrent(event);
    } else {
      setToast(event);
      setTimeout(processNext, 3200);
    }
  }, [shiftEvent]);

  useEffect(() => {
    if (!current && !toast && queue.length > 0) {
      processNext();
    }
  }, [queue.length, current, toast, processNext]);

  const handleModalClose = () => {
    setCurrent(null);
    setTimeout(processNext, 300);
  };

  const handleToastDone = () => {
    setToast(null);
    setTimeout(processNext, 200);
  };

  return (
    <>
      {children}
      {current?.type === "level_up" && (
        <LevelUpModal level={current.level} onClose={handleModalClose} />
      )}
      {toast && <CelebrationToast event={toast} onDone={handleToastDone} />}
    </>
  );
}
