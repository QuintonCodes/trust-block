import { z } from "zod";

// Schemas
export const milestoneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z.number({ error: "Must be a number" }).or(z.nan()).optional(),
});

export const createEscrowSchema = z
  .object({
    projectTitle: z.string().min(1, "Project Title is required"),
    scopeOfWork: z.string().min(1, "Scope of work is required"),
    dueDate: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Optional field
          const inputDate = new Date(val);
          const today = new Date(new Date().toISOString().split("T")[0]);
          return inputDate >= today;
        },
        { message: "Due date cannot be in the past" },
      ),
    useMilestones: z.boolean(),
    fundImmediately: z.boolean(),
    totalAmount: z.number({ error: "Must be a number" }).or(z.nan()).optional(),
    milestones: z.array(milestoneSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useMilestones) {
      if (!data.milestones || data.milestones.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one milestone",
          path: ["milestones"],
        });
        return;
      }

      data.milestones.forEach((m, index) => {
        if (!m.title || m.title.trim() === "") {
          ctx.addIssue({
            code: "custom",
            message: "Milestone title is required",
            path: ["milestones", index, "title"],
          });
        }
        if (
          typeof m.amount !== "number" ||
          isNaN(m.amount) ||
          m.amount < 0.01
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Amount must be at least 0.01",
            path: ["milestones", index, "amount"],
          });
        }
      });
    } else {
      if (
        typeof data.totalAmount !== "number" ||
        isNaN(data.totalAmount) ||
        data.totalAmount <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Total amount must be greater than 0",
          path: ["totalAmount"],
        });
      }
    }
  });

export type CreateEscrowFormValues = z.infer<typeof createEscrowSchema>;

export const settingsSchema = z.object({
  role: z.enum(["WORKER", "CLIENT"]),
  displayName: z
    .string()
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  notifications: z.object({
    emailDeposits: z.boolean(),
    emailPayouts: z.boolean(),
    emailMilestones: z.boolean(),
    browserNotifications: z.boolean(),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const submitWorkSchema = z
  .object({
    submissionType: z.enum(["link", "file"]).nullable(),
    deploymentUrl: z.string().optional(),
    fileUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.submissionType === "link") {
      try {
        new URL(data.deploymentUrl || "");
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Please enter a valid URL",
          path: ["deploymentUrl"],
        });
      }
    }
    if (data.submissionType === "file" && !data.fileUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Please upload a file before submitting",
        path: ["fileUrl"],
      });
    }
  });

export type SubmitWorkValues = z.infer<typeof submitWorkSchema>;

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

export type SubmissionType = "LINK" | "FILE";

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
  dueDate: Date | null;
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
  submissionType: SubmissionType | null;
  submissionUrl: string | null;
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
  dueDate?: Date;
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
  title: string;
  value: string;
  description: string;
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
