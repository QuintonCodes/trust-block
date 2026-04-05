import { Clock, FileText, Shield, TrendingUp } from "lucide-react";

import { DashboardMetrics } from "@/lib/types";
import { formatCompactNumber } from "@/lib/web3/utils";

const metricConfig = [
  {
    key: "totalSecured" as const,
    label: "Total USDC Secured",
    icon: Shield,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "lifetimeEarnings" as const,
    label: "Lifetime Earnings",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    key: "activeEscrows" as const,
    label: "Active Escrows",
    icon: FileText,
    color: "text-tb-warning",
    bgColor: "bg-tb-warning/10",
    isCount: true,
  },
  {
    key: "pendingDeposits" as const,
    label: "Pending Deposits",
    icon: Clock,
    color: "text-secondary-foreground",
    bgColor: "bg-secondary-foreground/10",
    isCount: true,
  },
];

export function MetricsCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricConfig.map((config) => {
        const Icon = config.icon;
        const value = metrics[config.key];

        return (
          <div
            key={config.key}
            className="rounded-xl border border-border bg-secondary p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary-foreground">
                {config.label}
              </p>
              <div className={`rounded-lg p-2 ${config.bgColor}`}>
                <Icon className={`size-5 ${config.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-white">
                {config.isCount ? value : formatCompactNumber(value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
