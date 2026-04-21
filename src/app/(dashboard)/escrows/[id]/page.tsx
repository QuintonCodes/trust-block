"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  LinkIcon,
  Loader2,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SubmitWorkModal } from "@/components/escrow/submit-work-modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useGetEscrow } from "@/lib/api/hooks/use-escrows-queries";
import { Milestone } from "@/lib/types";
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
  const { address, isMounted } = useWallet();

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

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null,
  );
  const [milestoneToSubmit, setMilestoneToSubmit] = useState<Milestone | null>(
    null,
  );
  const [dueDateCountdown, setDueDateCountdown] = useState("");

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

  // Calculate overall project due date countdown
  useEffect(() => {
    if (!escrow?.milestones) return;

    // Get the latest due date from milestones
    const dueDates = escrow.milestones
      .filter((m) => m.dueDate)
      .map((m) => new Date(m.dueDate!).getTime());

    if (dueDates.length === 0) return;

    const latestDueDate = Math.max(...dueDates);

    const updateCountdown = () => {
      const now = Date.now();
      const diff = latestDueDate - now;

      if (diff <= 0) {
        setDueDateCountdown("Overdue");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setDueDateCountdown(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setDueDateCountdown(`${hours}h ${minutes}m remaining`);
      } else {
        setDueDateCountdown(`${minutes}m remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [escrow?.milestones]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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
      <div className="py-12 text-center">
        <h1 className="text-2xl font-semibold text-white">Escrow Not Found</h1>
        <p className="mt-2 text-secondary-foreground">
          The escrow you are looking for does not exist or failed to load.
        </p>
        <Link href="/escrows">
          <Button className="mt-4 text-white bg-ring hover:bg-ring/80">
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
          <div className="border-2 rounded-full size-5 border-accent bg-accent/20" />
        );
      default:
        return <div className="border-2 rounded-full size-5 border-border" />;
    }
  }

  const getMilestoneDueCountdown = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff <= 0) return { overdue: true, text: "Overdue" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 7) {
      return { overdue: false, text: `${days} days left` };
    } else if (days > 0) {
      return {
        overdue: false,
        text: `${days}d ${hours}h left`,
        urgent: days <= 3,
      };
    }
    return { overdue: false, text: `${hours}h left`, urgent: true };
  };

  const openSubmitModal = (milestone: Milestone, index: number) => {
    setMilestoneToSubmit(milestone);
    setMilestoneIndex(index);
    setSubmitModalOpen(true);
  };

  const handleSubmitWork = async (
    submissionType: "link" | "file",
    submissionData: string,
  ) => {
    if (!milestoneToSubmit) return;

    setSelectedMilestone(milestoneIndex);
    resetSubmit();

    // In production, you would also save the submission type and URL to the database
    // For now, we proceed with the on-chain submission
    await submitMilestone(escrow.id, milestoneIndex);
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/escrows"
            className="inline-flex items-center mb-4 text-sm text-secondary-foreground hover:text-white"
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
              {(escrow.status === "AWAITING_FUNDS" ||
                escrow.status === "DRAFT") && (
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

        {/* Due Date Banner */}
        {dueDateCountdown && (
          <div
            className={`rounded-xl border p-4 ${
              dueDateCountdown === "Overdue"
                ? "border-[#EF4444]/30 bg-[#EF4444]/10"
                : dueDateCountdown.includes("remaining") &&
                    parseInt(dueDateCountdown) <= 3
                  ? "border-[#F59E0B]/30 bg-[#F59E0B]/10"
                  : "border-[#4F46E5]/30 bg-[#4F46E5]/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar
                className={`h-5 w-5 ${
                  dueDateCountdown === "Overdue"
                    ? "text-[#EF4444]"
                    : "text-[#4F46E5]"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  Project Deadline
                </p>
                <p
                  className={`text-sm ${
                    dueDateCountdown === "Overdue"
                      ? "text-[#EF4444]"
                      : "text-[#A9B5C6]"
                  }`}
                >
                  {dueDateCountdown}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Scope of Work */}
            <div className="p-6 border rounded-xl border-border bg-secondary">
              <h2 className="mb-4 text-lg font-medium text-white">
                Scope of Work
              </h2>
              <p className="whitespace-pre-wrap text-secondary-foreground">
                {escrow.scopeOfWork}
              </p>
            </div>

            {/* Milestones */}
            {escrow.milestones && escrow.milestones.length > 0 && (
              <div className="p-6 border rounded-xl border-border bg-secondary">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Milestones</h2>
                  <span className="text-sm text-secondary-foreground">
                    {completedMilestones}/{totalMilestones} completed
                  </span>
                </div>
                <Progress value={progress} className="h-2 mb-6 bg-border" />

                <div className="space-y-4">
                  {escrow.milestones.map((milestone, index) => {
                    const autoRelease = milestone.autoReleaseAt
                      ? getAutoReleaseTime(milestone.autoReleaseAt)
                      : null;
                    const dueCountdown = getMilestoneDueCountdown(
                      milestone.dueDate,
                    );

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

                            {/* Submission Info */}
                            {milestone.submissionUrl &&
                              (isInReview || isPaid) && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0F172A] p-3">
                                  {milestone.submissionType === "LINK" ? (
                                    <LinkIcon className="size-4 text-primary" />
                                  ) : (
                                    <FileArchive className="size-4 text-accent" />
                                  )}
                                  <span className="text-sm text-[#A9B5C6] flex-1 truncate">
                                    {milestone.submissionType === "LINK"
                                      ? "Deployment"
                                      : "File"}
                                    : {milestone.submissionUrl}
                                  </span>
                                  <a
                                    href={milestone.submissionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary/80 hover:text-primary"
                                  >
                                    {milestone.submissionType === "LINK" ? (
                                      <ExternalLink className="size-4" />
                                    ) : (
                                      <Download className="size-4" />
                                    )}
                                  </a>
                                </div>
                              )}

                            {/* Auto-release countdown for pending approval milestones */}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                              {/* Due date countdown */}
                              {dueCountdown && !isPaid && (
                                <div
                                  className={`flex items-center gap-1 ${
                                    dueCountdown.overdue
                                      ? "text-destructive"
                                      : dueCountdown.urgent
                                        ? "text-tb-warning"
                                        : "text-secondary-foreground"
                                  }`}
                                >
                                  <Calendar className="size-3.5" />
                                  <span>{dueCountdown.text}</span>
                                </div>
                              )}

                              {autoRelease && !isPaid && (
                                <div className="flex items-center gap-1">
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
                            </div>

                            {/* Action buttons */}
                            {(canApprove || canSubmit || canAutoRelease) && (
                              <div className="flex items-center gap-3 mt-4">
                                {canApprove && (
                                  <Button
                                    onClick={() =>
                                      handleApproveMilestone(index)
                                    }
                                    disabled={isLoading}
                                    size="sm"
                                    className="text-white bg-accent/80 hover:bg-accent"
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
                                    className="text-white bg-ring/80 hover:bg-ring"
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
                                className="inline-flex items-center gap-1 mt-2 text-xs text-ring hover:text-primary/80"
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
              <div className="p-6 border rounded-xl border-tb-warning/30 bg-tb-warning/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-tb-warning/20">
                    <Timer className="size-5 text-tb-warning" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      Auto-Release Policy
                    </h3>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      When a worker submits their work for review, you have 3
                      days to approve or request changes. If no action is taken,
                      the funds will be automatically released to the worker.
                      This protects workers from clients who go silent.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions */}
            {transactions.length > 0 && (
              <div className="p-6 border rounded-xl border-border bg-secondary">
                <h2 className="mb-4 text-lg font-medium text-white">
                  Transaction History
                </h2>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border rounded-lg border-border bg-background"
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
            <div className="p-6 border rounded-xl border-border bg-secondary">
              <h2 className="mb-4 text-lg font-medium text-white">
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-foreground">
                    Total Amount
                  </span>
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
                <div className="pt-3 border-t border-border">
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
            <div className="p-6 border rounded-xl border-border bg-secondary">
              <h2 className="mb-4 text-lg font-medium text-white">Parties</h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-secondary-foreground">
                    Worker
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {truncateAddress(escrow.freelancerAddress, 8, 6)}
                    </span>
                    {isWorker && (
                      <span className="text-xs text-ring">(You)</span>
                    )}
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
                    <p className="mb-1 text-sm text-secondary-foreground">
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
                    <p className="mb-1 text-sm text-secondary-foreground">
                      Client
                    </p>
                    <p className="text-sm text-tb-warning">Awaiting deposit</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {(approveError || submitError || autoReleaseError) && (
              <div className="p-4 border rounded-xl border-destructive/30 bg-destructive/5">
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

      {/* Submit Work Modal */}
      {milestoneToSubmit && (
        <SubmitWorkModal
          isOpen={submitModalOpen}
          onClose={() => {
            setSubmitModalOpen(false);
            setMilestoneToSubmit(null);
          }}
          milestone={milestoneToSubmit}
          escrowId={escrow.id}
          onSubmit={handleSubmitWork}
          isSubmitting={isSubmitPending || isSubmitConfirming}
        />
      )}
    </div>
  );
}
