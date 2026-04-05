import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EscrowLink } from "@/lib/types";
import { EscrowCard } from "./escrow-card";

type EscrowsListProps = {
  escrows: EscrowLink[];
  title?: string;
  showViewAll?: boolean;
  emptyMessage?: string;
};

export function EscrowsList({
  escrows,
  title = "Active Escrows",
  showViewAll = true,
  emptyMessage = "No escrows found",
}: EscrowsListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {showViewAll && escrows.length > 0 && (
            <Link href="/escrows">
              <Button
                variant="ghost"
                size="sm"
                className="text-secondary-foreground hover:text-white"
              >
                View All
              </Button>
            </Link>
          )}
          <Link href="/escrows/new">
            <Button
              size="sm"
              className="bg-primary/80 hover:bg-primary text-white"
            >
              <Plus className="mr-1.5 size-4" />
              New Escrow
            </Button>
          </Link>
        </div>
      </div>

      {escrows.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-secondary/50 p-12 text-center">
          <p className="text-secondary-foreground">{emptyMessage}</p>
          <Link href="/escrows/new">
            <Button className="mt-4 bg-primary/80 hover:bg-primary text-white">
              <Plus className="mr-2 size-4" />
              Create Your First Escrow
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {escrows.map((escrow) => (
            <EscrowCard key={escrow.id} escrow={escrow} />
          ))}
        </div>
      )}
    </div>
  );
}
