import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/40 bg-gradient-to-b from-primary/10 to-card text-center">
        <DialogHeader className="items-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Level Up!</DialogTitle>
          <DialogDescription className="text-base">
            Você alcançou o nível <span className="font-mono font-bold text-primary">{level}</span>
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full" onClick={onClose}>
          Continuar operação
        </Button>
      </DialogContent>
    </Dialog>
  );
}
