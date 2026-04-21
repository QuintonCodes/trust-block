"use client";

import {
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDeleteEscrowDb } from "@/lib/api/hooks/use-escrows-mutations";
import { EscrowLink } from "@/lib/types";
import {
  copyToClipboard,
  formatDate,
  formatUSDC,
  generateEscrowLink,
  truncateAddress,
} from "@/lib/web3/utils";

export function EscrowCard({ escrow }: { escrow: EscrowLink }) {
  const { mutateAsync: deleteEscrow, isPending: isDeleting } =
    useDeleteEscrowDb();

  const completedMilestones =
    escrow.milestones?.filter((m) => m.status === "APPROVED_AND_PAID").length ||
    0;
  const totalMilestones = escrow.milestones?.length || 1;
  const progress = (completedMilestones / totalMilestones) * 100;

  async function handleCopyLink() {
    const link = generateEscrowLink(escrow.id);
    const success = await copyToClipboard(link);
    if (success) {
      toast.success("Payment link copied to clipboard");
    } else {
      toast.error("Failed to copy link");
    }
  }

  async function handleDelete() {
    try {
      await deleteEscrow(escrow.id);
      toast.success("Draft escrow deleted successfully");
    } catch {
      toast.error("Failed to delete draft escrow");
    }
  }

  return (
    <div className="p-5 transition-colors border group rounded-xl border-border bg-secondary hover:border-primary/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-white">{escrow.projectTitle}</h3>
            <StatusBadge status={escrow.status} />
          </div>

          {escrow.clientAddress ? (
            <p className="mt-1 text-sm text-secondary-foreground">
              Client:{" "}
              <span className="text-white">
                {truncateAddress(escrow.clientAddress)}
              </span>
            </p>
          ) : (
            <span className="text-tb-warning">Awaiting deposit</span>
          )}
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-white">
            {formatUSDC(escrow.totalAmount)}
          </p>
          <p className="text-sm text-secondary-foreground">{escrow.currency}</p>
        </div>
      </div>

      {/* Progress */}
      {totalMilestones > 1 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-foreground">Progress</span>
            <span className="text-white">
              {completedMilestones}/{totalMilestones} milestones
            </span>
          </div>
          <Progress value={progress} className="mt-2 h-1.5 bg-border" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
        <p className="text-xs text-secondary-foreground">
          Created {formatDate(escrow.createdAt)}
        </p>

        <div className="flex items-center gap-2">
          {escrow.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 size-3.5" />
              )}
              Delete
            </Button>
          )}

          {escrow.status === "AWAITING_FUNDS" ||
            (escrow.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-secondary-foreground hover:text-white hover:bg-border"
              >
                <Copy className="mr-1.5 size-3.5" />
                Copy Link
              </Button>
            ))}

          {escrow.contractAddress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `https://polygonscan.com/address/${escrow.contractAddress}`,
                  "_blank",
                )
              }
              className="h-8 text-secondary-foreground hover:text-white hover:bg-border"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}

          <Link href={`/escrows/${escrow.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-secondary-foreground hover:text-white hover:bg-border"
            >
              View
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
