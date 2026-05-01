"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Shield,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useGetEscrow } from "@/lib/api/hooks/use-escrows-queries";
import { getCleanErrorMessage } from "@/lib/utils";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { usePaymentLogic } from "@/lib/web3/hooks/use-payment-logic";
import {
  formatDate,
  formatUSDC,
  getExplorerTxUrl,
  truncateAddress,
} from "@/lib/web3/utils";
import {
  getTransactionStatusMessage,
  TransactionStatus,
  useWallet,
} from "@/lib/web3/wallet-context";

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
    disconnect,
    isCorrectNetwork,
    switchToCorrectNetwork,
  } = useWallet();

  const { data: escrow, isLoading, isError } = useGetEscrow(id);

  const {
    usdcBalance,
    usdcAllowance,
    isCheckingOnChain,
    isSelfFunding,
    createStatus,
    depositStatus,
    approvalStatus,
    currentStep,
    getStepStatus,
    handleCreate,
    handleApproveUSDC,
    handleDeposit,
    createHash,
    approvalHash,
    depositHash,
    createError,
    approvalError,
    depositError,
    isCreatePending,
    isCreateConfirming,
    isApprovalPending,
    isApprovalConfirming,
    isDepositPending,
    isDepositConfirming,
  } = usePaymentLogic(
    escrow,
    address as `0x${string}` | undefined,
    isConnected,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !escrow) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="p-4 mx-auto mb-6 rounded-full bg-destructive/20 w-fit">
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

  // Handle case where escrow is already funded / locked
  const isEscrowAlreadyFunded =
    escrow && !["DRAFT", "AWAITING_FUNDS"].includes(escrow.status);

  if (isEscrowAlreadyFunded && currentStep !== "complete") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="p-4 mx-auto mb-6 rounded-full bg-accent/20 w-fit">
            <Info className="size-8 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Escrow Already Funded
          </h1>
          <p className="mt-2 text-secondary-foreground">
            This escrow has already been successfully funded and is currently in{" "}
            <span className="font-semibold text-white">{escrow.status}</span>{" "}
            status.
          </p>
          <div className="pt-4">
            <Link href={`/escrows/${escrow.id}`}>
              <Button className="w-full text-white bg-primary/80 hover:bg-primary">
                View Escrow Details
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSelfFunding) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="p-4 mx-auto mb-6 rounded-full bg-destructive/20 w-fit">
            <Shield className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Action Not Allowed (Dev Mode)
          </h1>
          <p className="mt-2 text-secondary-foreground">
            You cannot fund your own escrow. Please ensure you are logged in
            with a client wallet.
          </p>

          <Button
            onClick={disconnect}
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Disconnect & Switch Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (currentStep === "complete") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="p-8 text-center border rounded-xl border-border bg-secondary">
            <div className="p-4 mx-auto mb-6 rounded-full bg-accent/20 w-fit">
              <Check className="size-8 text-accent" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Payment Successful!
            </h1>
            <p className="mt-2 text-secondary-foreground">
              Your funds are now secured in the smart contract escrow.
            </p>

            <div className="p-4 mt-6 border rounded-lg border-border bg-background">
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">
                  Amount Deposited
                </span>
                <span className="text-lg font-semibold text-accent">
                  {formatUSDC(escrow.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Link href={`/escrows/${escrow.id}`}>
                <Button className="w-full bg-primary/80 hover:bg-primary text-white">
                  View Escrow Dashboard
                </Button>
              </Link>

              {depositHash && (
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
              )}
            </div>

            <div className="p-4 mt-6 border rounded-lg border-accent/30 bg-accent/5">
              <div className="flex items-start gap-3">
                <Lock className="size-5 text-accent shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-accent">
                    Funds Secured
                  </p>
                  <p className="mt-1 text-sm text-secondary-foreground">
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
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="TrustBlock Logo"
                width={200}
                height={40}
                className="object-contain w-auto h-auto"
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
                  className="text-black bg-tb-warning/80 hover:bg-tb-warning"
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
              className="text-white bg-primary/80 hover:bg-primary"
            >
              <Wallet className="mr-2 size-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Project Details */}
          <div className="space-y-6 lg:col-span-3">
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
            <div className="p-6 border rounded-xl border-border bg-secondary">
              <h2 className="mb-3 text-lg font-medium text-white">
                Scope of Work
              </h2>
              <p className="whitespace-pre-wrap text-secondary-foreground">
                {escrow.scopeOfWork}
              </p>
            </div>

            {/* Milestones */}
            {escrow.milestones && escrow.milestones.length > 0 && (
              <div className="p-6 border rounded-xl border-border bg-secondary">
                <h2 className="mb-4 text-lg font-medium text-white">
                  Payment Milestones
                </h2>
                <div className="space-y-3">
                  {escrow.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-4 border rounded-lg border-border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-xs border rounded-full size-6 border-border text-secondary-foreground">
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
            <div className="p-6 border rounded-xl border-primary/30 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/20">
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
            <div className="sticky p-6 border top-8 rounded-xl border-border bg-secondary">
              <h2 className="mb-4 text-lg font-medium text-white">
                Payment Summary
              </h2>

              <div className="mb-6 space-y-3">
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

              <div className="pt-4 mb-6 border-t border-border">
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
              <div className="mb-6 space-y-3">
                {/* Step 1 */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("connect") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("connect") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("connect") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex items-center justify-center text-xs border border-current rounded-full size-5">
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

                {/* Step 2 */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("create") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("create") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("create") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex items-center justify-center text-xs border border-current rounded-full size-5">
                        2
                      </div>
                    )}
                    <span
                      className={
                        getStepStatus("create") === "complete"
                          ? "text-accent"
                          : "text-white"
                      }
                    >
                      Initialize Smart Contract
                    </span>
                  </div>
                  {currentStep === "create" && createStatus !== "idle" && (
                    <p className="mt-2 ml-8 text-xs text-secondary-foreground">
                      {getTransactionStatusMessage(
                        createStatus as TransactionStatus,
                      )}
                    </p>
                  )}
                  {createHash && currentStep === "create" && (
                    <a
                      href={getExplorerTxUrl(createHash, PRIMARY_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 ml-8 text-xs text-primary/80 hover:text-primary"
                    >
                      View on explorer <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* Step 3 */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("approve") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("approve") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("approve") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex items-center justify-center text-xs border border-current rounded-full size-5">
                        3
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
                    <p className="mt-2 ml-8 text-xs text-secondary-foreground">
                      {getTransactionStatusMessage(
                        approvalStatus as TransactionStatus,
                      )}
                    </p>
                  )}
                  {approvalHash && currentStep === "approve" && (
                    <a
                      href={getExplorerTxUrl(approvalHash, PRIMARY_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 ml-8 text-xs text-primary/80 hover:text-primary"
                    >
                      View on explorer <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* Step 4 */}
                <div
                  className={`rounded-lg border p-3 ${getStepStatus("deposit") === "complete" ? "border-accent/30 bg-accent/5" : getStepStatus("deposit") === "current" ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center gap-3">
                    {getStepStatus("deposit") === "complete" ? (
                      <Check className="size-5 text-accent" />
                    ) : (
                      <div className="flex items-center justify-center text-xs border border-current rounded-full size-5">
                        4
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
                    <p className="mt-2 ml-8 text-xs text-secondary-foreground">
                      {getTransactionStatusMessage(
                        depositStatus as TransactionStatus,
                      )}
                    </p>
                  )}
                  {depositHash && (
                    <a
                      href={getExplorerTxUrl(depositHash, PRIMARY_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 ml-8 text-xs text-primary/80 hover:text-primary"
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
                  className="w-full text-white bg-primary/80 hover:bg-primary"
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
                  className="w-full text-black bg-tb-warning/80 hover:bg-tb-warning"
                >
                  <AlertCircle className="mr-2 size-4" />
                  Switch to{" "}
                  {CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG]
                    ?.name || "Polygon"}
                </Button>
              ) : currentStep === "create" ? (
                <Button
                  onClick={handleCreate}
                  disabled={
                    isCheckingOnChain || isCreatePending || isCreateConfirming
                  }
                  className="w-full text-white bg-primary/80 hover:bg-primary disabled:opacity-50"
                >
                  {isCheckingOnChain ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Checking Contract...
                    </>
                  ) : isCreatePending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Confirm in Wallet...
                    </>
                  ) : isCreateConfirming ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating Escrow...
                    </>
                  ) : createError ? (
                    <>
                      <AlertCircle className="mr-2 size-4" />
                      Retry Initialization
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 size-4" />
                      Initialize Escrow Contract
                    </>
                  )}
                </Button>
              ) : currentStep === "approve" ? (
                <Button
                  onClick={handleApproveUSDC}
                  disabled={
                    isApprovalPending ||
                    isApprovalConfirming ||
                    usdcAllowance === undefined
                  }
                  className="w-full text-white bg-primary/80 hover:bg-primary disabled:opacity-50"
                >
                  {usdcAllowance === undefined ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Checking Allowance...
                    </>
                  ) : isApprovalPending ? (
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
                  className="w-full text-white bg-accent/80 hover:bg-accent disabled:opacity-50"
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
              {(createError || approvalError || depositError) && (
                <div className="p-3 mt-4 border rounded-lg border-destructive/30 bg-destructive/5">
                  <p className="text-sm text-destructive">
                    {getCleanErrorMessage(
                      createError || approvalError || depositError,
                    )}
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-center text-secondary-foreground">
                By depositing, you agree to TrustBlock&apos;s terms of service
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
