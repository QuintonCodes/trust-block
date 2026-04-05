'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, encodeAbiParameters, keccak256 } from 'viem'
import { ESCROW_ABI, ERC20_ABI } from '../escrow-abi'
import { ESCROW_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS, PRIMARY_CHAIN_ID } from '../config'

// USDC has 6 decimals
const USDC_DECIMALS = 6

// Convert escrow ID string to bytes32
export function escrowIdToBytes32(escrowId: string): `0x${string}` {
  // Create a deterministic bytes32 from the escrow ID
  const encoded = encodeAbiParameters(
    [{ type: 'string' }],
    [escrowId]
  )
  return keccak256(encoded)
}

// Convert USDC amount to contract format (with 6 decimals)
export function parseUSDC(amount: number | string): bigint {
  const num = typeof amount === 'string' ? amount : amount.toString()
  return parseUnits(num, USDC_DECIMALS)
}

// Format USDC from contract format to number
export function formatUSDCFromContract(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS
}

// ============ Read Hooks ============

/**
 * Hook to get escrow status from the smart contract
 */
export function useEscrowStatus(escrowId: string | undefined) {
  const bytes32Id = escrowId ? escrowIdToBytes32(escrowId) : undefined
  
  return useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrowStatus',
    args: bytes32Id ? [bytes32Id] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!bytes32Id,
    },
  })
}

/**
 * Hook to get milestone details from the smart contract
 */
export function useMilestone(escrowId: string | undefined, milestoneIndex: number) {
  const bytes32Id = escrowId ? escrowIdToBytes32(escrowId) : undefined
  
  return useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getMilestone',
    args: bytes32Id ? [bytes32Id, BigInt(milestoneIndex)] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!bytes32Id,
    },
  })
}

/**
 * Hook to check USDC allowance
 */
export function useUSDCAllowance(ownerAddress: `0x${string}` | undefined) {
  const usdcAddress = USDC_CONTRACT_ADDRESS[PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS]
  
  return useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress, ESCROW_CONTRACT_ADDRESS] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!ownerAddress,
    },
  })
}

/**
 * Hook to check USDC balance
 */
export function useUSDCBalance(address: `0x${string}` | undefined) {
  const usdcAddress = USDC_CONTRACT_ADDRESS[PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS]
  
  return useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: PRIMARY_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  })
}

// ============ Write Hooks ============

/**
 * Hook to approve USDC spending
 */
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (amount: number | string) => {
    const usdcAddress = USDC_CONTRACT_ADDRESS[PRIMARY_CHAIN_ID as keyof typeof USDC_CONTRACT_ADDRESS]
    const parsedAmount = parseUSDC(amount)
    
    writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ESCROW_CONTRACT_ADDRESS, parsedAmount],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}

/**
 * Hook to deposit funds into escrow
 */
export function useDepositFunds() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = async (escrowId: string, amount: number | string) => {
    const bytes32Id = escrowIdToBytes32(escrowId)
    const parsedAmount = parseUSDC(amount)
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'depositFunds',
      args: [bytes32Id, parsedAmount],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}

/**
 * Hook to submit milestone for review
 */
export function useSubmitMilestone() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const submit = async (escrowId: string, milestoneIndex: number) => {
    const bytes32Id = escrowIdToBytes32(escrowId)
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'submitMilestone',
      args: [bytes32Id, BigInt(milestoneIndex)],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    submit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}

/**
 * Hook to approve milestone and release funds (client only)
 */
export function useApproveMilestone() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (escrowId: string, milestoneIndex: number) => {
    const bytes32Id = escrowIdToBytes32(escrowId)
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'approveMilestone',
      args: [bytes32Id, BigInt(milestoneIndex)],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}

/**
 * Hook to trigger auto-release after 3 days
 */
export function useAutoReleaseMilestone() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const autoRelease = async (escrowId: string, milestoneIndex: number) => {
    const bytes32Id = escrowIdToBytes32(escrowId)
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'autoReleaseMilestone',
      args: [bytes32Id, BigInt(milestoneIndex)],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    autoRelease,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}

/**
 * Hook to request changes on a milestone (client only)
 */
export function useRequestChanges() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const requestChanges = async (escrowId: string, milestoneIndex: number, reason: string) => {
    const bytes32Id = escrowIdToBytes32(escrowId)
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'requestChanges',
      args: [bytes32Id, BigInt(milestoneIndex), reason],
      chainId: PRIMARY_CHAIN_ID,
    })
  }

  return {
    requestChanges,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    reset,
  }
}
