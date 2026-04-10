"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useGetEscrow } from "@/lib/api/hooks/use-escrows-queries";
import { PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import {
  useApproveMilestone,
  useAutoReleaseMilestone,
  useSubmitMilestone,
} from "@/lib/web3/hooks/use-escrow";
import {
  copyToClipboard,
  formatDate,
  formatUSDC,
  generateEscrowLink,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";
import { useWallet, type TransactionStatus } from "@/lib/web3/wallet-context";

export default function EscrowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address } = useWallet();

  // Fetch Escrow Data
  const {
    data: escrow,
    isLoading: isEscrowLoading,
    error: escrowFetchError,
    refetch: refetchEscrow,
  } = useGetEscrow(id);

  // Wagmi hooks
  const {
    approve: approveMilestone,
    hash: approveHash,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    error: approveError,
    reset: resetApprove,
  } = useApproveMilestone();

  const {
    submit: submitMilestone,
    hash: submitHash,
    isPending: isSubmitPending,
    isConfirming: isSubmitConfirming,
    isConfirmed: isSubmitConfirmed,
    error: submitError,
    reset: resetSubmit,
  } = useSubmitMilestone();

  const {
    autoRelease,
    hash: autoReleaseHash,
    isPending: isAutoReleasePending,
    isConfirming: isAutoReleaseConfirming,
    isConfirmed: isAutoReleaseConfirmed,
    error: autoReleaseError,
    reset: resetAutoRelease,
  } = useAutoReleaseMilestone();

  // Transaction states
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null,
  );

  // Derive action status from hook states
  const actionStatus = useMemo((): TransactionStatus => {
    if (isApprovePending || isSubmitPending || isAutoReleasePending) {
      return "awaiting-signature";
    } else if (
      isApproveConfirming ||
      isSubmitConfirming ||
      isAutoReleaseConfirming
    ) {
      return "confirming";
    } else if (
      isApproveConfirmed ||
      isSubmitConfirmed ||
      isAutoReleaseConfirmed
    ) {
      return "confirmed";
    } else if (approveError || submitError || autoReleaseError) {
      return "error";
    } else {
      return "idle";
    }
  }, [
    isApprovePending,
    isSubmitPending,
    isAutoReleasePending,
    isApproveConfirming,
    isSubmitConfirming,
    isAutoReleaseConfirming,
    isApproveConfirmed,
    isSubmitConfirmed,
    isAutoReleaseConfirmed,
    approveError,
    submitError,
    autoReleaseError,
  ]);

  // Handle side effects for confirmations and errors
  useEffect(() => {
    if (isApproveConfirmed || isSubmitConfirmed || isAutoReleaseConfirmed) {
      toast.success("Transaction confirmed!");
      refetchEscrow();
      setTimeout(() => setSelectedMilestone(null), 1000);
    }
  }, [
    isApproveConfirmed,
    isSubmitConfirmed,
    isAutoReleaseConfirmed,
    refetchEscrow,
  ]);

  if (isEscrowLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-accent" />
        <p className="mt-4 text-secondary-foreground">
          Loading escrow details...
        </p>
      </div>
    );
  }

  if (escrowFetchError || !escrow) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-white">Escrow Not Found</h1>
        <p className="mt-2 text-secondary-foreground">
          The escrow you are looking for does not exist or failed to load.
        </p>
        <Link href="/escrows">
          <Button className="mt-4 bg-ring hover:bg-ring/80 text-white">
            Back to Escrows
          </Button>
        </Link>
      </div>
    );
  }

  const transactions = escrow.transactions || [];
  const activeHash = approveHash || submitHash || autoReleaseHash;

  // Determine user role for this escrow
  const isWorker =
    address?.toLowerCase() === escrow.freelancerAddress.toLowerCase();
  const isClient =
    address?.toLowerCase() === escrow.clientAddress?.toLowerCase();

  const completedMilestones =
    escrow.milestones?.filter(
      (m) => m.status === "APPROVED_AND_PAID" || m.status === "AUTO_RELEASED",
    ).length || 0;
  const totalMilestones = escrow.milestones?.length || 1;
  const progress = (completedMilestones / totalMilestones) * 100;

  async function handleCopyLink() {
    const link = generateEscrowLink(escrow?.id || "");
    const success = await copyToClipboard(link);
    if (success) {
      toast.success("Payment link copied to clipboard");
    }
  }

  async function handleApproveMilestone(milestoneIndex: number) {
    setSelectedMilestone(milestoneIndex);
    resetApprove();
    await approveMilestone(escrow?.id || "", milestoneIndex);
  }

  async function handleSubmitMilestone(milestoneIndex: number) {
    setSelectedMilestone(milestoneIndex);
    resetSubmit();
    await submitMilestone(escrow?.id || "", milestoneIndex);
  }

  async function handleAutoRelease(milestoneIndex: number) {
    setSelectedMilestone(milestoneIndex);
    resetAutoRelease();
    await autoRelease(escrow?.id || "", milestoneIndex);
  }

  // Calculate time until auto-release
  function getAutoReleaseTime(autoReleaseAt: Date | null) {
    if (!autoReleaseAt) return null;
    const now = new Date();
    const releaseDate = new Date(autoReleaseAt);
    const diff = releaseDate.getTime() - now.getTime();

    if (diff <= 0) return { expired: true, text: "Ready for auto-release" };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return {
        expired: false,
        text: `${days}d ${remainingHours}h until auto-release`,
      };
    }
    return { expired: false, text: `${hours}h until auto-release` };
  }

  function milestoneStatusIcon(status: string) {
    switch (status) {
      case "APPROVED_AND_PAID":
      case "AUTO_RELEASED":
        return <CheckCircle2 className="size-5 text-accent" />;
      case "WORK_SUBMITTED":
      case "PENDING_APPROVAL":
        return <Clock className="size-5 text-tb-warning" />;
      case "FUNDED":
        return (
          <div className="size-5 rounded-full border-2 border-accent bg-accent/20" />
        );
      default:
        return <div className="size-5 rounded-full border-2 border-border" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/escrows"
          className="inline-flex items-center text-sm text-secondary-foreground hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Escrows
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">
                {escrow.projectTitle}
              </h1>
              <StatusBadge status={escrow.status} />
            </div>
            <p className="mt-1 text-sm text-secondary-foreground">
              Created {formatDate(escrow.createdAt)}
              {isWorker && (
                <span className="ml-2 text-ring">You are the worker</span>
              )}
              {isClient && (
                <span className="ml-2 text-accent">You are the client</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {escrow.status === "AWAITING_FUNDS" && (
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-border text-secondary-foreground hover:text-white"
              >
                <Copy className="mr-2 size-4" />
                Copy Payment Link
              </Button>
            )}
            {escrow.contractAddress && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    getExplorerAddressUrl(escrow.contractAddress!),
                    "_blank",
                  )
                }
                className="border-border text-secondary-foreground hover:text-white"
              >
                <ExternalLink className="mr-2 size-4" />
                View Contract
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope of Work */}
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Scope of Work
            </h2>
            <p className="text-secondary-foreground whitespace-pre-wrap">
              {escrow.scopeOfWork}
            </p>
          </div>

          {/* Milestones */}
          {escrow.milestones && escrow.milestones.length > 0 && (
            <div className="rounded-xl border border-border bg-secondary p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Milestones</h2>
                <span className="text-sm text-secondary-foreground">
                  {completedMilestones}/{totalMilestones} completed
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-border mb-6" />

              <div className="space-y-4">
                {escrow.milestones.map((milestone, index) => {
                  const autoRelease = milestone.autoReleaseAt
                    ? getAutoReleaseTime(milestone.autoReleaseAt)
                    : null;

                  const isPaid =
                    milestone.status === "APPROVED_AND_PAID" ||
                    milestone.status === "AUTO_RELEASED";
                  const isInReview =
                    milestone.status === "WORK_SUBMITTED" ||
                    milestone.status === "PENDING_APPROVAL";

                  // Rules for buttons based on roles and statuses
                  const canApprove = isClient && isInReview;
                  const canSubmit = isWorker && milestone.status === "FUNDED";
                  const canAutoRelease = autoRelease?.expired && isInReview;

                  const isLoading =
                    selectedMilestone === index &&
                    actionStatus !== "idle" &&
                    actionStatus !== "error" &&
                    actionStatus !== "confirmed";

                  return (
                    <div
                      key={milestone.id}
                      className={`rounded-lg border p-4 ${
                        isPaid
                          ? "border-accent/30 bg-accent/5"
                          : isInReview
                            ? "border-tb-warning/30 bg-tb-warning/5"
                            : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {milestoneStatusIcon(milestone.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white">
                              {index + 1}. {milestone.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={milestone.status}
                                type="milestone"
                              />
                              <span className="font-medium text-white">
                                {formatUSDC(milestone.amount)}
                              </span>
                            </div>
                          </div>
                          {milestone.description && (
                            <p className="mt-1 text-sm text-secondary-foreground">
                              {milestone.description}
                            </p>
                          )}

                          {/* Auto-release countdown for pending approval milestones */}
                          {autoRelease && !isPaid && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <Timer className="size-3.5 text-tb-warning" />
                              <span
                                className={
                                  autoRelease.expired
                                    ? "text-accent"
                                    : "text-tb-warning"
                                }
                              >
                                {autoRelease.text}
                              </span>
                            </div>
                          )}

                          {milestone.dueDate && (
                            <p className="mt-2 text-xs text-secondary-foreground">
                              Due: {formatDate(milestone.dueDate)}
                            </p>
                          )}

                          {/* Action buttons */}
                          {(canApprove || canSubmit || canAutoRelease) && (
                            <div className="mt-4 flex items-center gap-3">
                              {canApprove && (
                                <Button
                                  onClick={() => handleApproveMilestone(index)}
                                  disabled={isLoading}
                                  size="sm"
                                  className="bg-accent/80 hover:bg-accent text-white"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                                      {actionStatus === "awaiting-signature"
                                        ? "Confirm in wallet..."
                                        : "Confirming..."}
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 size-3.5" />
                                      Approve & Release Funds
                                    </>
                                  )}
                                </Button>
                              )}

                              {canSubmit && (
                                <Button
                                  onClick={() => handleSubmitMilestone(index)}
                                  disabled={isLoading}
                                  size="sm"
                                  className="bg-ring/80 hover:bg-ring text-white"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                                      {actionStatus === "awaiting-signature"
                                        ? "Confirm in wallet..."
                                        : "Confirming..."}
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 size-3.5" />
                                      Submit for Review
                                    </>
                                  )}
                                </Button>
                              )}

                              {canAutoRelease && (
                                <Button
                                  onClick={() => handleAutoRelease(index)}
                                  disabled={isLoading}
                                  size="sm"
                                  variant="outline"
                                  className="border-accent text-accent hover:bg-accent/10"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Timer className="mr-2 size-3.5" />
                                      Trigger Auto-Release
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Transaction hash link */}
                          {selectedMilestone === index && activeHash && (
                            <a
                              href={getExplorerTxUrl(
                                activeHash,
                                PRIMARY_CHAIN_ID,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-ring hover:text-primary/80"
                            >
                              View transaction{" "}
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto-release info for clients */}
          {isClient && (
            <div className="rounded-xl border border-tb-warning/30 bg-tb-warning/5 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-tb-warning/20 p-2">
                  <Timer className="size-5 text-tb-warning" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    Auto-Release Policy
                  </h3>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    When a worker submits their work for review, you have 3 days
                    to approve or request changes. If no action is taken, the
                    funds will be automatically released to the worker. This
                    protects workers from clients who go silent.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {transactions.length > 0 && (
            <div className="rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Transaction History
              </h2>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                  >
                    <div>
                      <p className="font-medium text-white capitalize">
                        {tx.transactionType.toLowerCase().replace("_", " ")}
                      </p>
                      <p className="text-sm text-secondary-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-medium ${
                          tx.transactionType === "DEPOSIT"
                            ? "text-accent"
                            : "text-white"
                        }`}
                      >
                        {tx.transactionType === "DEPOSIT" ? "+" : "-"}
                        {formatUSDC(tx.amount)}
                      </span>
                      <button
                        onClick={() =>
                          window.open(getExplorerTxUrl(tx.txHash), "_blank")
                        }
                        className="rounded p-1.5 text-secondary-foreground hover:bg-border hover:text-white"
                      >
                        <ExternalLink className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">Total Amount</span>
                <span className="font-semibold text-white">
                  {formatUSDC(escrow.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">
                  Protocol Fee (3%)
                </span>
                <span className="text-secondary-foreground">
                  -{formatUSDC(Number(escrow.totalAmount) * 0.03)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Net Amount</span>
                  <span className="text-lg font-semibold text-accent">
                    {formatUSDC(Number(escrow.totalAmount) * 0.97)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-medium text-white mb-4">Parties</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-secondary-foreground mb-1">Worker</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">
                    {truncateAddress(escrow.freelancerAddress, 8, 6)}
                  </span>
                  {isWorker && <span className="text-xs text-ring">(You)</span>}
                  <button
                    onClick={() =>
                      window.open(
                        getExplorerAddressUrl(escrow.freelancerAddress),
                        "_blank",
                      )
                    }
                    className="text-secondary-foreground hover:text-white"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                </div>
              </div>
              {escrow.clientAddress ? (
                <div>
                  <p className="text-sm text-secondary-foreground mb-1">
                    Client
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {truncateAddress(escrow.clientAddress, 8, 6)}
                    </span>
                    {isClient && (
                      <span className="text-xs text-accent">(You)</span>
                    )}
                    <button
                      onClick={() =>
                        window.open(
                          getExplorerAddressUrl(escrow.clientAddress!),
                          "_blank",
                        )
                      }
                      className="text-secondary-foreground hover:text-white"
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-secondary-foreground mb-1">
                    Client
                  </p>
                  <p className="text-sm text-tb-warning">Awaiting deposit</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {(approveError || submitError || autoReleaseError) && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">
                    Transaction Failed
                  </p>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    {(approveError || submitError || autoReleaseError)
                      ?.message || "Please try again."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
