import { useEffect, useMemo, useRef } from "react";

import {
  useRecordDepositDb,
  useUpdateEscrowDb,
} from "@/lib/api/hooks/use-escrows-mutations";
import { EscrowLink } from "@/lib/types";
import {
  parseUSDC,
  useApproveUSDC,
  useCreateEscrow,
  useDepositFunds,
  useEscrowStatus,
  useUSDCAllowance,
  useUSDCBalance,
} from "@/lib/web3/hooks/use-escrow";

export type PaymentStep =
  | "connect"
  | "create"
  | "approve"
  | "deposit"
  | "complete";

export function usePaymentLogic(
  escrow: EscrowLink | undefined,
  address: `0x${string}` | undefined,
  isConnected: boolean,
) {
  const { mutate: recordDeposit } = useRecordDepositDb();
  const { mutate: updateEscrow } = useUpdateEscrowDb();

  const dbRecorded = useRef(false);
  const createRecorded = useRef(false);

  // Blockchain Data Hooks
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: usdcAllowance } = useUSDCAllowance(address);
  const { data: onChainEscrow, isLoading: isCheckingOnChain } = useEscrowStatus(
    escrow?.id,
  );

  const isCreatedOnChain = useMemo(() => {
    if (!onChainEscrow) return false;
    return onChainEscrow[0] !== "0x0000000000000000000000000000000000000000";
  }, [onChainEscrow]);

  // Write Hooks
  const {
    create: createEscrowContract,
    hash: createHash,
    isPending: isCreatePending,
    isConfirming: isCreateConfirming,
    isConfirmed: isCreateConfirmed,
    error: createError,
    reset: resetCreate,
  } = useCreateEscrow();

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

  useEffect(() => {
    if (
      (isCreateConfirmed || isCreatedOnChain) &&
      escrow?.status === "DRAFT" &&
      !createRecorded.current
    ) {
      createRecorded.current = true;

      updateEscrow({
        id: escrow.id,
        status: "AWAITING_FUNDS",
      });
    }
  }, [isCreateConfirmed, isCreatedOnChain, escrow, updateEscrow]);

  const isSelfFunding = useMemo(() => {
    // Ensuring this is only checked during development as requested
    if (process.env.NODE_ENV !== "development") return false;

    return (
      isConnected &&
      address &&
      escrow?.freelancerAddress?.toLowerCase() === address.toLowerCase()
    );
  }, [isConnected, address, escrow]);

  const createStatus = useMemo(() => {
    if (isCreatePending) return "awaiting-signature";
    if (createHash && isCreateConfirming) return "confirming";
    if (isCreateConfirmed || isCreatedOnChain) return "confirmed";
    if (createError) return "error";
    return "idle";
  }, [
    isCreatePending,
    createHash,
    isCreateConfirming,
    isCreateConfirmed,
    isCreatedOnChain,
    createError,
  ]);

  const depositStatus = useMemo(() => {
    if (isDepositPending) return "awaiting-signature";
    if (depositHash && isDepositConfirming) return "confirming";
    if (isDepositConfirmed) return "confirmed";
    if (depositError) return "error";
    return "idle";
  }, [
    isDepositPending,
    depositHash,
    isDepositConfirming,
    isDepositConfirmed,
    depositError,
  ]);

  const approvalStatus = useMemo(() => {
    if (isApprovalPending) return "awaiting-signature";
    if (approvalHash && isApprovalConfirming) return "confirming";
    if (isApprovalConfirmed) return "confirmed";
    if (approvalError) return "error";
    return "idle";
  }, [
    isApprovalPending,
    approvalHash,
    isApprovalConfirming,
    isApprovalConfirmed,
    approvalError,
  ]);

  const currentStep = useMemo(() => {
    if (!isConnected) return "connect";
    if (depositStatus === "confirmed" || isDepositConfirmed) return "complete";

    if (escrow) {
      if (!isCreatedOnChain && !isCreateConfirmed) {
        return "create";
      }
      if (usdcAllowance === undefined) {
        return "approve";
      }

      const requiredAmount = parseUSDC(escrow.totalAmount);
      if (usdcAllowance >= requiredAmount || isApprovalConfirmed) {
        return "deposit";
      } else {
        return "approve";
      }
    }
    return "connect";
  }, [
    isConnected,
    isCreatedOnChain,
    isCreateConfirmed,
    usdcAllowance,
    escrow,
    isApprovalConfirmed,
    isDepositConfirmed,
    depositStatus,
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

  async function handleCreate() {
    resetCreate();
    const contractMilestones =
      escrow?.milestones && escrow.milestones.length > 0
        ? escrow.milestones.map((m) => ({
            title: m.title,
            amount: Number(m.amount),
          }))
        : [{ title: "Full Project", amount: Number(escrow?.totalAmount) }];

    await createEscrowContract(
      escrow?.id || "",
      (escrow?.freelancerAddress as `0x${string}`) || "0x",
      Number(escrow?.totalAmount || 0),
      contractMilestones,
    );
  }

  async function handleApproveUSDC() {
    resetApproval();
    await approveUSDC(escrow?.totalAmount || 0);
  }

  async function handleDeposit() {
    resetDeposit();
    await depositFunds(escrow?.id || "", escrow?.totalAmount || 0);
  }

  function getStepStatus(step: PaymentStep) {
    const steps: PaymentStep[] = [
      "connect",
      "create",
      "approve",
      "deposit",
      "complete",
    ];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  }

  return {
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
  };
}
