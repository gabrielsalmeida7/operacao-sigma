import { RefreshCw } from "lucide-react";
import { CycleStatusCards } from "./CycleActivityLog";

interface CycleBoardFooterProps {
  totalBlocks: number;
}

export function CycleBoardFooter({ totalBlocks }: CycleBoardFooterProps) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <RefreshCw className="h-4 w-4 text-primary" />
      Ao concluir a sessão {totalBlocks}, volte à sessão 1 na próxima volta e pinte com a cor nova.
    </span>
  );
}

export { CycleStatusCards };
