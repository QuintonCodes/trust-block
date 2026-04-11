"use client";

import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  Lock,
  Shield,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRecordDepositDb } from "@/lib/api/hooks/use-escrows-mutations";
import { useGetEscrow } from "@/lib/api/hooks/use-escrows-queries";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import {
  parseUSDC,
  useApproveUSDC,
  useDepositFunds,
  useUSDCAllowance,
  useUSDCBalance,
} from "@/lib/web3/hooks/use-escrow";
import {
  formatDate,
  formatUSDC,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";
import {
  getTransactionStatusMessage,
  useWallet,
} from "@/lib/web3/wallet-context";

type PaymentStep = "connect" | "approve" | "deposit" | "complete";

interface Web3Error {
  shortMessage?: string;
  message?: string;
}

function getCleanErrorMessage(error: Web3Error | null | undefined): string {
  if (!error) return "";

  // Viem sometimes provides a shortMessage which is cleaner
  const msgText = (error.shortMessage || error.message || "").toLowerCase();

  if (msgText.includes("user rejected") || msgText.includes("user denied")) {
    return "Transaction was cancelled.";
  }
  if (msgText.includes("insufficient funds")) {
    return "You do not have enough funds to cover this transaction and gas fees.";
  }
  if (msgText.includes("unrecognized-selector")) {
    return "Contract error: Function not found. Check if the correct contract is deployed.";
  }

  // Fallback to viem's short message, or a generic error if neither exists
  return error.shortMessage || "Transaction failed. Please try again.";
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    isCorrectNetwork,
    switchToCorrectNetwork,
  } = useWallet();

  const { data: escrow, isLoading, isError } = useGetEscrow(id);
  const { mutate: recordDeposit } = useRecordDepositDb();

  const dbRecorded = useRef(false);

  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: usdcAllowance } = useUSDCAllowance(address);

  // Wagmi hooks for blockchain interactions
  const {
    approve: approveUSDC,
    hash: approvalHash,
    isPending: isApprovalPending,
    isConfirming: isApprovalConfirming,
    isConfirmed: isApprovalConfirmed,
    error: approvalError,
    reset: resetApproval,
  } = useApproveUSDC();

  const {
    deposit: depositFunds,
    hash: depositHash,
    isPending: isDepositPending,
    isConfirming: isDepositConfirming,
    isConfirmed: isDepositConfirmed,
    error: depositError,
    reset: resetDeposit,
  } = useDepositFunds();

  const isSelfFunding = useMemo(() => {
    return (
      isConnected &&
      address &&
      escrow?.freelancerAddress?.toLowerCase() === address.toLowerCase()
    );
  }, [isConnected, address, escrow]);

  const depositStatus = useMemo(() => {
    if (isDepositPending) {
      return "awaiting-signature";
    } else if (depositHash && isDepositConfirming) {
      return "confirming";
    } else if (isDepositConfirmed) {
      return "confirmed";
    } else if (depositError) {
      return "error";
    }
    return "idle";
  }, [
    isDepositPending,
    depositHash,
    isDepositConfirming,
    isDepositConfirmed,
    depositError,
  ]);

  const currentStep = useMemo(() => {
    if (!isConnected) {
      return "connect";
    } else if (depositStatus === "confirmed" || isDepositConfirmed) {
      return "complete";
    } else if (escrow && usdcAllowance !== undefined) {
      const requiredAmount = parseUSDC(escrow.totalAmount);
      if (usdcAllowance >= requiredAmount || isApprovalConfirmed) {
        return "deposit";
      } else {
        return "approve";
      }
    }
    return "connect"; // Default fallback
  }, [
    isConnected,
    usdcAllowance,
    escrow,
    isApprovalConfirmed,
    isDepositConfirmed,
    depositStatus,
  ]);

  const approvalStatus = useMemo(() => {
    if (isApprovalPending) {
      return "awaiting-signature";
    } else if (approvalHash && isApprovalConfirming) {
      return "confirming";
    } else if (isApprovalConfirmed) {
      return "confirmed";
    } else if (approvalError) {
      return "error";
    }
    return "idle";
  }, [
    isApprovalPending,
    approvalHash,
    isApprovalConfirming,
    isApprovalConfirmed,
    approvalError,
  ]);

  useEffect(() => {
    if (
      isDepositConfirmed &&
      depositHash &&
      escrow &&
      address &&
      !dbRecorded.current
    ) {
      dbRecorded.current = true;
      recordDeposit({
        escrowLinkId: escrow.id,
        txHash: depositHash,
        fromAddress: address,
        toAddress: escrow.contractAddress || escrow.freelancerAddress,
        amount: Number(escrow.totalAmount),
      });
    }
  }, [isDepositConfirmed, depositHash, escrow, address, recordDeposit]);

  async function handleApproveUSDC() {
    resetApproval();
    await approveUSDC(escrow?.totalAmount || 0);
  }

  async function handleDeposit() {
    resetDeposit();
    await depositFunds(escrow?.id || "", escrow?.totalAmount || 0);
  }

  function getStepStatus(step: PaymentStep) {
    const steps: PaymentStep[] = ["connect", "approve", "deposit", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !escrow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-full bg-destructive/20 p-4 w-fit mx-auto mb-6">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Payment Link Not Found
          </h1>
          <p className="mt-2 text-secondary-foreground">
            This payment link may have expired or been cancelled.
          </p>
        </div>
      </div>
    );
  }

  if (isSelfFunding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-full bg-destructive/20 p-4 w-fit mx-auto mb-6">
            <Shield className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Action Not Allowed
          </h1>
          <p className="mt-2 text-secondary-foreground">
            You cannot fund your own escrow. Please ensure you are logged in
            with a client wallet.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="rounded-xl border border-border bg-secondary p-8 text-center">
            <div className="rounded-full bg-accent/20 p-4 w-fit mx-auto mb-6">
              <Check className="size-8 text-accent" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Payment Successful!
            </h1>
            <p className="mt-2 text-secondary-foreground">
              Your funds are now secured in the smart contract escrow.
            </p>

            <div className="mt-6 p-4 rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">
                  Amount Deposited
                </span>
                <span className="text-lg font-semibold text-accent">
                  {formatUSDC(escrow.totalAmount)}
                </span>
              </div>
            </div>

            {depositHash && (
              <div className="mt-4">
                <a
                  href={getExplorerTxUrl(depositHash, PRIMARY_CHAIN_ID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary/80 hover:text-primary"
                >
                  View transaction on{" "}
                  {CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG]
                    ?.name || "Explorer"}
                  <ExternalLink className="size-4" />
                </a>
              </div>
            )}

            <div className="mt-6 p-4 rounded-lg border border-accent/30 bg-accent/5">
              <div className="flex items-start gap-3">
                <Lock className="size-5 text-accent shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-accent">
                    Funds Secured
                  </p>
                  <p className="text-sm text-secondary-foreground mt-1">
                    Your funds are locked in the escrow contract. They will be
                    released to the worker upon your approval of the completed
                    work, or automatically after 3 days if no action is taken.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="TrustBlock Logo"
                width={200}
                height={47}
                className="h-auto w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {isConnected && address ? (
            <div className="flex items-center gap-3">
              {!isCorrectNetwork && (
                <Button
                  onClick={switchToCorrectNetwork}
                  size="sm"
                  className="bg-tb-warning/80 hover:bg-tb-warning text-black"
                >
                  Switch Network
                </Button>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5">
                <div
                  className={`size-2 rounded-full ${isCorrectNetwork ? "bg-accent" : "bg-tb-warning"}`}
                />
                <span className="text-sm text-white">
                  {truncateAddress(address)}
                </span>
              </div>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="bg-primary/80 hover:bg-primary text-white"
            >
              <Wallet className="mr-2 size-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Project Details */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={escrow.status} />
              </div>
              <h1 className="text-2xl font-semibold text-white">
                {escrow.projectTitle}
              </h1>
              <p className="mt-1 text-sm text-secondary-foreground">
                Requested by{" "}
                <span className="text-white">
                  {truncateAddress(escrow.freelancerAddress, 8, 6)}
                </span>
              </p>
            </div>

            {/* Scope of Work */}
            <div className="rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-medium text-white mb-3">
                Scope of Work
              </h2>
              <p className="text-secondary-foreground whitespace-pre-wrap">
                {escrow.scopeOfWork}
              </p>
            </div>

            {/* Milestones */}
            {escrow.milestones && escrow.milestones.length > 0 && (
              <div className="rounded-xl border border-border bg-secondary p-6">
                <h2 className="text-lg font-medium text-white mb-4">
                  Payment Milestones
                </h2>
                <div className="space-y-3">
                  {escrow.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-6 items-center justify-center rounded-full border border-border text-xs text-secondary-foreground">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {milestone.title}
                          </p>
                          {milestone.description && (
                            <p className="text-sm text-secondary-foreground">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-white">
                        {formatUSDC(milestone.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Info */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/20 p-2">
                  <Shield className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    Protected by Smart Contract
                  </h3>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    Your funds are secured in an audited smart contract on{" "}
                    {CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG]
                      ?.name || "Polygon"}
                    . They will only be released when you approve the completed
                    work. If the worker submits and you take no action, funds
                    auto-release after 3 days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Payment Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-foreground">Amount</span>
                  <span className="font-semibold text-white">
                    {formatUSDC(escrow.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-foreground">Currency</span>
                  <span className="text-white">
                    USDC (
                    {CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG]
                      ?.name || "Polygon"}
                    )
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-foreground">Created</span>
                  <span className="text-white">
                    {formatDate(escrow.createdAt)}
                  </span>
                </div>
                {usdcBalance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-foreground">
                      Your Balance
                    </span>
                    <span
                      className={`${Number(usdcBalance) / 1e6 >= escrow.totalAmount ? "text-accent" : "text-destructive"}`}
                    >
                      {formatUSDC(Number(usdcBalance) / 1e6)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">
                    Total to Deposit
                  </span>
                  <span className="text-xl font-semibold text-accent">
                    {formatUSDC(escrow.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Steps */}
              <div className="space-y-3 mb-6">
                {/* Step 1: Connect Wallet */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("connect") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("connect") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("connect") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded-full border border-current text-xs">
                        1
                      </div>
                    )}
                    <span
                      className={
                        getStepStatus("connect") === "complete"
                          ? "text-accent"
                          : "text-white"
                      }
                    >
                      Connect Wallet
                    </span>
                  </div>
                </div>

                {/* Step 2: Approve USDC */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("approve") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("approve") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("approve") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded-full border border-current text-xs">
                        2
                      </div>
                    )}
                    <span
                      className={
                        getStepStatus("approve") === "complete"
                          ? "text-accent"
                          : "text-white"
                      }
                    >
                      Approve USDC
                    </span>
                  </div>
                  {currentStep === "approve" && approvalStatus !== "idle" && (
                    <p className="mt-2 text-xs text-secondary-foreground ml-8">
                      {getTransactionStatusMessage(approvalStatus)}
                    </p>
                  )}
                  {approvalHash && currentStep === "approve" && (
                    <a
                      href={getExplorerTxUrl(approvalHash, PRIMARY_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 ml-8 inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary"
                    >
                      View on explorer <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* Step 3: Deposit */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("deposit") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("deposit") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("deposit") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded-full border border-current text-xs">
                        3
                      </div>
                    )}
                    <span
                      className={
                        getStepStatus("deposit") === "complete"
                          ? "text-accent"
                          : "text-white"
                      }
                    >
                      Deposit to Escrow
                    </span>
                  </div>
                  {currentStep === "deposit" && depositStatus !== "idle" && (
                    <p className="mt-2 text-xs text-secondary-foreground ml-8">
                      {getTransactionStatusMessage(depositStatus)}
                    </p>
                  )}
                  {depositHash && (
                    <a
                      href={getExplorerTxUrl(depositHash, PRIMARY_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 ml-8 inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary"
                    >
                      View on explorer <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!isConnected ? (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full bg-primary/80 hover:bg-primary text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 size-4" />
                      Connect Wallet to Pay
                    </>
                  )}
                </Button>
              ) : !isCorrectNetwork ? (
                <Button
                  onClick={switchToCorrectNetwork}
                  className="w-full bg-tb-warning/80 hover:bg-tb-warning text-black"
                >
                  <AlertCircle className="mr-2 size-4" />
                  Switch to{" "}
                  {CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG]
                    ?.name || "Polygon"}
                </Button>
              ) : currentStep === "approve" ? (
                <Button
                  onClick={handleApproveUSDC}
                  disabled={isApprovalPending || isApprovalConfirming}
                  className="w-full bg-primary/80 hover:bg-primary text-white disabled:opacity-50"
                >
                  {isApprovalPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Confirm in Wallet...
                    </>
                  ) : isApprovalConfirming ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Confirming...
                    </>
                  ) : approvalError ? (
                    <>
                      <AlertCircle className="mr-2 size-4" />
                      Retry Approval
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 size-4" />
                      Approve USDC
                    </>
                  )}
                </Button>
              ) : currentStep === "deposit" ? (
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositPending || isDepositConfirming}
                  className="w-full bg-accent/80 hover:bg-accent text-white disabled:opacity-50"
                >
                  {isDepositPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Confirm in Wallet...
                    </>
                  ) : isDepositConfirming ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Confirming Deposit...
                    </>
                  ) : depositError ? (
                    <>
                      <AlertCircle className="mr-2 size-4" />
                      Retry Deposit
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 size-4" />
                      Deposit {formatUSDC(escrow.totalAmount)}
                    </>
                  )}
                </Button>
              ) : null}

              {/* Error Display */}
              {(approvalError || depositError) && (
                <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-sm text-destructive">
                    {getCleanErrorMessage(approvalError || depositError)}
                  </p>
                </div>
              )}

              <p className="mt-4 text-center text-xs text-secondary-foreground">
                By depositing, you agree to TrustBlock&apos;s terms of service
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
