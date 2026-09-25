import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCheckIn } from "@/lib/db/repositories/checkin";

interface DailyCheckInModalProps {
  open: boolean;
  onComplete: () => void;
}

export function DailyCheckInModal({ open, onComplete }: DailyCheckInModalProps) {
  const [mission, setMission] = useState("");

  const handleSubmit = async () => {
    if (!mission.trim()) return;
    await createCheckIn(mission.trim());
    onComplete();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Qual é sua missão hoje?</DialogTitle>
          <DialogDescription>
            Defina seu objetivo do dia. Ex: 20 questões de português.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Objetivo do dia..."
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <Button className="w-full" onClick={handleSubmit} disabled={!mission.trim()}>
            Iniciar Operação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
