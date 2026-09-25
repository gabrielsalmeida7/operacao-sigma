import { Progress } from "@/components/ui/progress";

interface XPBarProps {
  level: number;
  current: number;
  required: number;
  percent: number;
}

export function XPBar({ level, current, required, percent }: XPBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Nível <span className="font-mono text-primary">{level}</span></span>
        <span className="font-mono text-muted-foreground">{current} / {required} XP</span>
      </div>
      <Progress value={percent} className="h-3" />
    </div>
  );
}
