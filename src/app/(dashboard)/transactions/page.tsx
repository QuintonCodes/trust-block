"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { mockEscrows, mockTransactions } from "@/lib/mock-data";
import type { TransactionType } from "@/lib/types";
import {
  formatDate,
  formatUSDC,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";

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
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");

  const filteredTransactions = mockTransactions
    .filter((tx) => typeFilter === "ALL" || tx.transactionType === typeFilter)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  function getProjectTitle(escrowId: string) {
    const escrow = mockEscrows.find((e) => e.id === escrowId);
    return escrow?.projectTitle || "Unknown Project";
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
          <Download className="mr-2 h-4 w-4" />
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
      <div className="rounded-xl border border-border bg-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  From / To
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  TX
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const config = transactionTypeConfig[tx.transactionType];
                const Icon = config.icon;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-border/30 transition-colors"
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
                        {getProjectTitle(tx.escrowLinkId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-secondary-foreground">
                          {tx.transactionType === "DEPOSIT" ? "From: " : "To: "}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() =>
                          window.open(getExplorerTxUrl(tx.txHash), "_blank")
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-secondary-foreground hover:bg-border hover:text-white transition-colors"
                      >
                        {truncateAddress(tx.txHash, 6, 4)}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-secondary-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
