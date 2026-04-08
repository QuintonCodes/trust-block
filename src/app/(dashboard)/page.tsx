import { EscrowsList } from "@/components/dashboard/escrows-list";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { mockEscrows, mockMetrics, mockTransactions } from "@/lib/mock-data";

export default function DashboardPage() {
  // Filter active escrows (not DRAFT, RELEASED, or CANCELLED)
  const activeEscrows = mockEscrows.filter(
    (e) => !["DRAFT", "RELEASED", "CANCELLED"].includes(e.status),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Metrics Row */}
      <MetricsCards metrics={mockMetrics} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Active Escrows - Takes 2 columns */}
        <div className="lg:col-span-2">
          <EscrowsList
            escrows={activeEscrows.slice(0, 4)}
            title="Active Escrows"
            showViewAll={activeEscrows.length > 4}
          />
        </div>

        {/* Recent Transactions - Takes 1 column */}
        <div>
          <RecentTransactions transactions={mockTransactions} />
        </div>
      </div>
    </div>
  );
}
