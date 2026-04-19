"use client";

import { FileX, Loader2, PlusCircle, ReceiptText } from "lucide-react";
import Link from "next/link";

import { EscrowsList } from "@/components/dashboard/escrows-list";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/lib/api/hooks/use-dashboard";
import { useWallet } from "@/lib/web3/wallet-context";

export default function DashboardPage() {
  const { address, isConnected, isMounted } = useWallet();
  const { data, isLoading, isError } = useDashboardData(address);

  // 1. Hydration check
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Not Connected State
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-secondary">
          <ReceiptText className="size-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Welcome to TrustBlock
        </h2>
        <p className="max-w-md text-secondary-foreground">
          Please connect your wallet using the button in the top right corner to
          view your dashboard.
        </p>
      </div>
    );
  }

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Error State
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-tb-warning">
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  const { metrics, activeEscrows, transactions } = data;
  const hasActiveEscrows = activeEscrows.length > 0;
  const hasTransactions = transactions.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Metrics Row */}
      <MetricsCards metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Active Escrows - Takes 2 columns */}
        <div className="space-y-4 lg:col-span-2">
          {hasActiveEscrows ? (
            <EscrowsList
              escrows={activeEscrows.slice(0, 4)}
              showViewAll={activeEscrows.length > 4}
            />
          ) : (
            // Empty State UI for Escrows
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg border-border bg-secondary/20">
              <FileX className="mb-4 size-10 text-secondary-foreground" />
              <h4 className="mb-2 font-medium text-white">No active escrows</h4>
              <p className="max-w-sm mb-6 text-sm text-secondary-foreground">
                You don&apos;t have any ongoing projects right now. Create a new
                escrow to secure your next payment.
              </p>
              <Link href="/escrows/new">
                <Button>
                  <PlusCircle className="mr-2 size-4" /> Create Escrow
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions - Takes 1 column */}
        <div className="space-y-4">
          {hasTransactions ? (
            <RecentTransactions transactions={transactions} />
          ) : (
            // Empty State UI for Transactions
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg border-border bg-secondary/20 h-75">
              <ReceiptText className="mb-4 size-8 text-secondary-foreground" />
              <p className="text-sm text-secondary-foreground">
                No recent transactions found. Activity will appear here once an
                escrow is funded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
