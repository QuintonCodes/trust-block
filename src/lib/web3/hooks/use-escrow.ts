"use client";

import { encodeAbiParameters, keccak256, parseUnits } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";

import {
  ESCROW_CONTRACT_ADDRESS,
  PRIMARY_CHAIN_ID,
  USDC_CONTRACT_ADDRESS,
} from "../config";
import {
  useReadErc20Allowance,
  useReadErc20BalanceOf,
  useReadTrustBlockEscrowEscrowMilestones,
  useReadTrustBlockEscrowEscrows,
  useWriteErc20Approve,
  useWriteTrustBlockEscrowApproveMilestone,
  useWriteTrustBlockEscrowAutoReleaseMilestone,
  useWriteTrustBlockEscrowCreateEscrow,
  useWriteTrustBlockEscrowDepositFunds,
  useWriteTrustBlockEscrowSubmitMilestone,
} from "../generated";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// Convert escrow ID string to bytes32
export function escrowIdToBytes32(escrowId: string): `0x${string}` {
  // Create a deterministic bytes32 from the escrow ID
  const encoded = encodeAbiParameters([{ type: "string" }], [escrowId]);
  return keccak256(encoded);
}

// Convert USDC amount to contract format (with 6 decimals)
export function parseUSDC(amount: number | string): bigint {
  const num = typeof amount === "string" ? amount : amount.toString();
  return parseUnits(num, USDC_DECIMALS);
}

// Format USDC from contract format to number
export function formatUSDCFromContract(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS;
}

// ============ Read Hooks ============

/**
 * Hook to get escrow status from the smart contract
 */
export function useEscrowStatus(escrowId: string | undefined) {
  const bytes32Id = escrowId ? escrowIdToBytes32(escrowId) : undefined;

  return useReadTrustBlockEscrowEscrows({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    args: bytes32Id ? [bytes32Id] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!bytes32Id,
    },
  });
}

/**
 * Hook to get milestone details from the smart contract
 */
export function useMilestone(
  escrowId: string | undefined,
  milestoneIndex: number,
) {
  const bytes32Id = escrowId ? escrowIdToBytes32(escrowId) : undefined;

  return useReadTrustBlockEscrowEscrowMilestones({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    args: bytes32Id ? [bytes32Id, BigInt(milestoneIndex)] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!bytes32Id,
    },
  });
}

/**
 * Hook to check USDC allowance
 */
export function useUSDCAllowance(ownerAddress: `0x${string}` | undefined) {
  const usdcAddress =
    USDC_CONTRACT_ADDRESS[
      PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS
    ];

  return useReadErc20Allowance({
    address: usdcAddress as `0x${string}`,
    args: ownerAddress
      ? [ownerAddress, ESCROW_CONTRACT_ADDRESS as `0x${string}`]
      : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!ownerAddress,
    },
  });
}

/**
 * Hook to check USDC balance
 */
export function useUSDCBalance(address: `0x${string}` | undefined) {
  const usdcAddress =
    USDC_CONTRACT_ADDRESS[
      PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS
    ];

  return useReadErc20BalanceOf({
    address: usdcAddress as `0x${string}`,
    args: address ? [address] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });
}

// ============ Write Hooks ============
/**
 * Hook to create an escrow
 */
export function useCreateEscrow() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteTrustBlockEscrowCreateEscrow();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  const create = async (
    escrowId: string,
    freelancerAddress: `0x${string}`,
    totalAmount: number,
    milestones: { title: string; amount: number }[],
  ) => {
    const bytes32Id = escrowIdToBytes32(escrowId);
    const parsedTotal = parseUSDC(totalAmount);
    const titles = milestones.map((m) => m.title);
    const amounts = milestones.map((m) => parseUSDC(m.amount));

    await mutateAsync({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      args: [bytes32Id, freelancerAddress, parsedTotal, titles, amounts],
    });
  };

  return {
    create,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}

/**
 * Hook to approve USDC spending
 */
export function useApproveUSDC() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteErc20Approve();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (amount: number | string) => {
    const usdcAddress =
      USDC_CONTRACT_ADDRESS[
        PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS
      ];

    await mutateAsync({
      address: usdcAddress as `0x${string}`,
      args: [ESCROW_CONTRACT_ADDRESS, parseUSDC(amount)],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}

/**
 * Hook to deposit funds into escrow
 */
export function useDepositFunds() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteTrustBlockEscrowDepositFunds();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (escrowId: string, amount: number | string) => {
    await mutateAsync({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      args: [escrowIdToBytes32(escrowId), parseUSDC(amount)],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}

/**
 * Hook to submit milestone for review
 */
export function useSubmitMilestone() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteTrustBlockEscrowSubmitMilestone();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const submit = async (escrowId: string, milestoneIndex: number) => {
    await mutateAsync({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      args: [escrowIdToBytes32(escrowId), BigInt(milestoneIndex)],
    });
  };

  return {
    submit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}

/**
 * Hook to approve milestone and release funds (client only)
 */
export function useApproveMilestone() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteTrustBlockEscrowApproveMilestone();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (escrowId: string, milestoneIndex: number) => {
    await mutateAsync({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      args: [escrowIdToBytes32(escrowId), BigInt(milestoneIndex)],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}

/**
 * Hook to trigger auto-release after 3 days
 */
export function useAutoReleaseMilestone() {
  const {
    mutateAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteTrustBlockEscrowAutoReleaseMilestone();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const autoRelease = async (escrowId: string, milestoneIndex: number) => {
    await mutateAsync({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      args: [escrowIdToBytes32(escrowId), BigInt(milestoneIndex)],
    });
  };

  return {
    autoRelease,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  };
}
