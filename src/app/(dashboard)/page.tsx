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
  const { address, isConnected } = useWallet();
  const { data, isLoading, isError } = useDashboardData(address);

  // 1. Not Connected State
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-secondary rounded-full">
          <ReceiptText className="size-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Welcome to TrustBlock
        </h2>
        <p className="text-secondary-foreground max-w-md">
          Please connect your wallet using the button in the top right corner to
          view your dashboard.
        </p>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Error State
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Active Escrows</h3>
            {hasActiveEscrows && (
              <Link href="/escrows/new">
                <Button size="sm" variant="outline">
                  <PlusCircle className="mr-2 size-4" /> New Escrow
                </Button>
              </Link>
            )}
          </div>

          {hasActiveEscrows ? (
            <EscrowsList
              escrows={activeEscrows.slice(0, 4)}
              showViewAll={activeEscrows.length > 4}
            />
          ) : (
            // Empty State UI for Escrows
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg border-border bg-secondary/20">
              <FileX className="size-10 text-secondary-foreground mb-4" />
              <h4 className="text-white font-medium mb-2">No active escrows</h4>
              <p className="text-sm text-secondary-foreground mb-6 max-w-sm">
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
          <h3 className="text-lg font-medium text-white">
            Recent Transactions
          </h3>

          {hasTransactions ? (
            <RecentTransactions transactions={transactions} />
          ) : (
            // Empty State UI for Transactions
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg border-border bg-secondary/20 h-75">
              <ReceiptText className="size-8 text-secondary-foreground mb-4" />
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
