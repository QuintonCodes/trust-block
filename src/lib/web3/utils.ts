/**
 * Truncate an Ethereum address for display
 * Example: 0x1234567890abcdef... -> 0x1234...cdef
 */
export function truncateAddress(
  address: string,
  startLength = 6,
  endLength = 4,
): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format USDC amount with proper decimals
 * USDC has 6 decimals
 */
export function formatUSDC(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return formatUSDC(num);
}

/**
 * Generate a shareable escrow link
 */
export function generateEscrowLink(escrowId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pay/${escrowId}`;
  }
  return `/pay/${escrowId}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(d);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string, chainId = 137): string {
  if (chainId === 31337) return "#";

  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    137: "https://polygonscan.com/tx/",
    80002: "https://amoy.polygonscan.com/tx/", // Polygon Amoy Testnet
  };
  return `${explorers[chainId] || explorers[137]}${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(address: string, chainId = 137): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/address/",
    137: "https://polygonscan.com/address/",
    80002: "https://amoy.polygonscan.com/address/", // Polygon Amoy Testnet
  };
  return `${explorers[chainId] || explorers[137]}${address}`;
}

export type ContractEscrowStatus = 0 | 1 | 2 | 3 | 4 | 5;
export const CONTRACT_STATUS_MAP = {
  0: "AWAITING_FUNDS",
  1: "LOCKED",
  2: "IN_REVIEW",
  3: "RELEASED",
  4: "IN_DISPUTE",
  5: "CANCELLED",
} as const;

// Type for milestone status from contract
export type ContractMilestoneStatus = 0 | 1 | 2 | 3 | 4 | 5;
export const CONTRACT_MILESTONE_STATUS_MAP = {
  0: "PENDING_FUNDS",
  1: "FUNDED",
  2: "WORK_SUBMITTED",
  3: "PENDING_APPROVAL",
  4: "APPROVED_AND_PAID",
  5: "AUTO_RELEASED",
} as const;
