"use client";

import { ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Transaction } from "@/lib/types";
import {
  formatRelativeTime,
  formatUSDC,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";

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
    label: "Fee",
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

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Recent Transactions</h2>
        <Link href="/transactions">
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary-foreground hover:text-white"
          >
            View All
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-secondary">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-secondary-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.slice(0, 5).map((tx) => {
              const config = transactionTypeConfig[tx.transactionType];
              const Icon = config.icon;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${config.bgColor}`}>
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {config.label}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {tx.transactionType === "DEPOSIT" ? "From" : "To"}:{" "}
                        {truncateAddress(
                          tx.transactionType === "DEPOSIT"
                            ? tx.fromAddress
                            : tx.toAddress,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${tx.transactionType === "DEPOSIT" ? "text-accent" : "text-white"}`}
                      >
                        {tx.transactionType === "DEPOSIT" ? "+" : "-"}
                        {formatUSDC(tx.amount)}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {formatRelativeTime(tx.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        window.open(getExplorerTxUrl(tx.txHash), "_blank")
                      }
                      className="rounded-lg p-1.5 text-secondary-foreground transition-colors hover:bg-border hover:text-white"
                    >
                      <ExternalLink className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
