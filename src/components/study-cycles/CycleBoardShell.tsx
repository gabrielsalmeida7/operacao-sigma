import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CycleBoardShellProps {
  title: string;
  subtitle?: string;
  banner?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function CycleBoardShell({
  title,
  subtitle,
  banner = "Operação Sigma | Ciclo Rotativo ATRF",
  children,
  footer,
  className,
}: CycleBoardShellProps) {
  return (
    <div
      className={cn(
        "overflow-visible rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="border-b border-primary/20 bg-primary/10 px-5 py-2.5 text-xs font-medium tracking-wide text-primary">
        {banner}
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            <span className="border-b-[3px] border-primary pb-1">{title}</span>
          </h2>
          {subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {children}

        {footer && (
          <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
