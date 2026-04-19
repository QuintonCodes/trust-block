"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { EscrowCard } from "@/components/dashboard/escrow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEscrowsList } from "@/lib/api/hooks/use-escrows-list";
import type { EscrowStatus } from "@/lib/types";
import { useWallet } from "@/lib/web3/wallet-context";

// 1. Zod Schema for search validation
const searchSchema = z.object({
  searchQuery: z.string().optional(),
});

const statusFilters: { label: string; value: EscrowStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Awaiting Funds", value: "AWAITING_FUNDS" },
  { label: "Locked", value: "LOCKED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Released", value: "RELEASED" },
  { label: "Draft", value: "DRAFT" },
];

export default function EscrowsPage() {
  const { address, isConnected, isMounted } = useWallet();
  const [statusFilter, setStatusFilter] = useState<EscrowStatus | "ALL">("ALL");

  // 2. Initialize React Hook Form
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchQuery: "",
    },
  });

  const searchValue =
    useWatch({
      control: form.control,
      name: "searchQuery",
    }) || "";

  // 3. Fetch Data via Tanstack Query
  const { data, isLoading, isError } = useEscrowsList(
    address,
    searchValue,
    statusFilter,
  );

  // --- States ---
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="p-4 bg-secondary rounded-full">
          <Wallet className="size-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Connect Your Wallet
        </h2>
        <p className="text-secondary-foreground max-w-md">
          Please connect your wallet to view and manage your active escrows.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Escrows</h1>
          <p className="mt-1 text-sm text-secondary-foreground">
            Manage your active and past escrow agreements
          </p>
        </div>
        <Link href="/escrows/new">
          <Button className="bg-primary/80 hover:bg-primary text-white">
            <Plus className="mr-2 size-4" />
            New Escrow
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form
          onSubmit={form.handleSubmit(() => {})}
          className="relative w-full md:w-96"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-foreground" />
            <Input
              placeholder="Search by title or scope..."
              className="pl-10 border-border bg-secondary text-white placeholder:text-secondary-foreground focus-visible:ring-primary"
              {...form.register("searchQuery")}
            />
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={
                statusFilter === filter.value
                  ? "bg-primary/80 text-white hover:bg-primary"
                  : "text-secondary-foreground hover:text-white hover:bg-border"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Escrows Grid */}
      {isLoading ? (
        <div className="flex min-h-100 flex-col items-center justify-center space-y-4 rounded-xl border border-border border-dashed bg-secondary/20">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-secondary-foreground">
            Loading escrows...
          </p>
        </div>
      ) : isError ? (
        <div className="flex min-h-100 flex-col items-center justify-center space-y-4 rounded-xl border border-destructive/50 border-dashed bg-destructive/10">
          <p className="text-sm text-destructive">
            Failed to load escrows. Please try again.
          </p>
        </div>
      ) : !data?.escrows || data.escrows.length === 0 ? (
        <div className="flex min-h-100 flex-col items-center justify-center space-y-4 rounded-xl border border-border border-dashed bg-secondary/20 p-12 text-center">
          <p className="text-secondary-foreground">
            {searchValue || statusFilter !== "ALL"
              ? "No escrows found matching your search criteria."
              : "You don't have any escrows yet. Create your first one!"}
          </p>
          {searchValue || statusFilter !== "ALL" ? (
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
                setStatusFilter("ALL");
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {data.escrows.map((escrow) => (
            <EscrowCard key={escrow.id} escrow={escrow} />
          ))}
        </div>
      )}
    </div>
  );
}
