import { CheckCircle, FileText, TrendingUp, Wallet } from "lucide-react";

import { DashboardMetrics } from "@/lib/types";

type MetricsCardsProps = {
  metrics: DashboardMetrics[];
};

// Map titles to specific icons and colors for dynamic rendering
const metricStyles: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  "Active Escrows": {
    icon: FileText,
    color: "text-tb-warning",
    bgColor: "bg-tb-warning/10",
  },
  "Total Volume": {
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  "Completed Projects": {
    icon: CheckCircle,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
};

const defaultStyle = {
  icon: Wallet,
  color: "text-secondary-foreground",
  bgColor: "bg-secondary-foreground/10",
};

export function MetricsCards({ metrics }: MetricsCardsProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => {
        const style = metricStyles[metric.title] || defaultStyle;
        const Icon = style.icon;

        return (
          <div
            key={metric.title}
            className="rounded-xl border border-border bg-secondary p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary-foreground">
                {metric.title}
              </p>
              <div className={`rounded-lg p-2 ${style.bgColor}`}>
                <Icon className={`size-5 ${style.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-secondary-foreground">
                {metric.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
