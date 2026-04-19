"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ExternalLink,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useGetTransactions } from "@/lib/api/hooks/use-transactions";
import type { TransactionType } from "@/lib/types";
import {
  formatDate,
  formatUSDC,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

const typeFilters: { label: string; value: TransactionType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Deposits", value: "DEPOSIT" },
  { label: "Payouts", value: "PAYOUT" },
  { label: "Fees", value: "FEE_COLLECTION" },
  { label: "Refunds", value: "REFUND" },
];

const transactionTypeConfig = {
  DEPOSIT: {
    label: "Deposit",
    icon: ArrowDownLeft,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  PAYOUT: {
    label: "Payout",
    icon: ArrowUpRight,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  FEE_COLLECTION: {
    label: "Protocol Fee",
    icon: ArrowUpRight,
    color: "text-secondary-foreground",
    bgColor: "bg-secondary-foreground/10",
  },
  REFUND: {
    label: "Refund",
    icon: ArrowUpRight,
    color: "text-tb-warning",
    bgColor: "bg-tb-warning/10",
  },
};

export default function TransactionsPage() {
  const { address, isConnected, isMounted } = useWallet();
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useGetTransactions(typeFilter, address);

  if (!isMounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="p-4 rounded-full bg-secondary">
          <ReceiptText className="size-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Connect Your Wallet
        </h2>
        <p className="max-w-md text-secondary-foreground">
          Please connect your wallet using the button in the top right corner to
          view your transaction history.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Transaction History
          </h1>
          <p className="mt-1 text-sm text-secondary-foreground">
            View all on-chain transactions related to your escrows
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border text-secondary-foreground hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((filter) => (
          <Button
            key={filter.value}
            variant="ghost"
            size="sm"
            onClick={() => setTypeFilter(filter.value)}
            className={
              typeFilter === filter.value
                ? "bg-primary/80 text-white hover:bg-primary"
                : "text-secondary-foreground hover:text-white hover:bg-border"
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden border rounded-xl border-border bg-secondary">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-secondary-foreground">
            <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
            <p>Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-destructive">
            <p>Failed to load transactions. Please try again.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-secondary-foreground">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-secondary-foreground">
                    Project
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-secondary-foreground">
                    From / To
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-right uppercase text-secondary-foreground">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-secondary-foreground">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-right uppercase text-secondary-foreground">
                    TX
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const config = transactionTypeConfig[tx.transactionType];
                  const Icon = config.icon;

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-border/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${config.bgColor}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {tx.escrowLink?.projectTitle || "Unknown Project"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="text-secondary-foreground">
                            {tx.transactionType === "DEPOSIT"
                              ? "From: "
                              : "To: "}
                          </span>
                          <span className="text-white">
                            {truncateAddress(
                              tx.transactionType === "DEPOSIT"
                                ? tx.fromAddress
                                : tx.toAddress,
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            tx.transactionType === "DEPOSIT"
                              ? "text-accent"
                              : "text-white"
                          }`}
                        >
                          {tx.transactionType === "DEPOSIT" ? "+" : "-"}
                          {formatUSDC(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary-foreground">
                          {formatDate(tx.timestamp)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            window.open(getExplorerTxUrl(tx.txHash), "_blank")
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors rounded-lg text-secondary-foreground hover:bg-border hover:text-white"
                        >
                          {truncateAddress(tx.txHash, 6, 4)}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-secondary-foreground">
                  No transactions found
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
