export type UserRole = "WORKER" | "CLIENT";

export type EscrowStatus =
  | "DRAFT"
  | "AWAITING_FUNDS"
  | "LOCKED"
  | "IN_REVIEW"
  | "RELEASED"
  | "CANCELLED"
  | "IN_DISPUTE";

export type MilestoneStatus =
  | "PENDING_FUNDS"
  | "FUNDED"
  | "WORK_SUBMITTED"
  | "PENDING_APPROVAL"
  | "APPROVED_AND_PAID"
  | "AUTO_RELEASED";

export type TransactionType =
  | "DEPOSIT"
  | "PAYOUT"
  | "FEE_COLLECTION"
  | "REFUND";

export interface User {
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export interface EscrowLink {
  id: string;
  freelancerAddress: string;
  clientAddress: string | null;
  projectTitle: string;
  scopeOfWork: string;
  totalAmount: number;
  currency: string;
  status: EscrowStatus;
  contractAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  milestones?: Milestone[];
  transactions?: Transaction[];
}

export interface Milestone {
  id: string;
  escrowLinkId: string;
  title: string;
  description: string | null;
  amount: number;
  orderIndex: number;
  status: MilestoneStatus;
  dueDate: Date | null;
  submittedAt: Date | null;
  autoReleaseAt: Date | null;
}

export interface Transaction {
  id: string;
  escrowLinkId: string;
  txHash: string;
  transactionType: TransactionType;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: Date;
}

// Form types for creating escrows
export interface CreateEscrowInput {
  projectTitle: string;
  scopeOfWork: string;
  totalAmount: number;
  currency?: string;
  milestones: CreateMilestoneInput[];
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  amount: number;
  dueDate?: Date;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalSecured: number;
  lifetimeEarnings: number;
  activeEscrows: number;
  pendingDeposits: number;
}

// Status badge variants
export const STATUS_VARIANTS: Record<
  EscrowStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive";
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  AWAITING_FUNDS: { label: "Awaiting Deposit", variant: "warning" },
  LOCKED: { label: "Funded", variant: "success" },
  IN_REVIEW: { label: "In Review", variant: "default" },
  RELEASED: { label: "Released", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  IN_DISPUTE: { label: "Disputed", variant: "destructive" },
};

export const MILESTONE_STATUS_VARIANTS: Record<
  MilestoneStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" }
> = {
  PENDING_FUNDS: { label: "Pending", variant: "secondary" },
  FUNDED: { label: "Funded", variant: "success" },
  WORK_SUBMITTED: { label: "Submitted", variant: "warning" },
  PENDING_APPROVAL: { label: "Awaiting Approval", variant: "warning" },
  APPROVED_AND_PAID: { label: "Paid", variant: "success" },
  AUTO_RELEASED: { label: "Auto-Released", variant: "success" },
};
