import type { EscrowStatus, MilestoneStatus } from "@/lib/types";
import { MILESTONE_STATUS_VARIANTS, STATUS_VARIANTS } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: EscrowStatus | MilestoneStatus;
  type?: "escrow" | "milestone";
  className?: string;
};

const variantStyles = {
  default: "bg-primary/20 text-[#818CF8] border-primary/30",
  secondary: "bg-border/50 text-secondary-foreground border-border",
  success: "bg-accent/20 text-[#34D399] border-accent/30",
  warning: "bg-tb-warning/20 text-[#FBBF24] border-tb-warning/30",
  destructive: "bg-destructive/20 text-[#F87171] border-destructive/30",
};

export function StatusBadge({
  status,
  type = "escrow",
  className,
}: StatusBadgeProps) {
  const config =
    type === "escrow"
      ? STATUS_VARIANTS[status as EscrowStatus]
      : MILESTONE_STATUS_VARIANTS[status as MilestoneStatus];

  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[config.variant],
        className,
      )}
    >
      {config.label}
    </span>
  );
}
