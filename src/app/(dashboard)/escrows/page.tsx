"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EscrowCard } from "@/components/dashboard/escrow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockEscrows } from "@/lib/mock-data";
import type { EscrowStatus } from "@/lib/types";

const statusFilters: { label: string; value: EscrowStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Awaiting Funds", value: "AWAITING_FUNDS" },
  { label: "Locked", value: "LOCKED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Released", value: "RELEASED" },
  { label: "Draft", value: "DRAFT" },
];

export default function EscrowsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EscrowStatus | "ALL">("ALL");

  const filteredEscrows = mockEscrows.filter((escrow) => {
    const matchesSearch =
      escrow.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.scopeOfWork.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || escrow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            placeholder="Search escrows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-border bg-secondary text-white placeholder:text-secondary-foreground"
          />
        </div>
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
      {filteredEscrows.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-secondary/50 p-12 text-center">
          <p className="text-secondary-foreground">
            No escrows found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEscrows.map((escrow) => (
            <EscrowCard key={escrow.id} escrow={escrow} />
          ))}
        </div>
      )}
    </div>
  );
}
