"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEscrowDb } from "@/lib/api/hooks/use-escrows-mutations";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { formatUSDC } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

const milestoneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z.number({ error: "Must be a number" }).or(z.nan()).optional(),
});

const formSchema = z
  .object({
    projectTitle: z.string().min(1, "Project Title is required"),
    scopeOfWork: z.string().min(1, "Scope of work is required"),
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

type FormSchema = z.infer<typeof formSchema>;

export default function NewEscrowPage() {
  const {
    address,
    isConnected,
    isMounted,
    connect,
    isCorrectNetwork,
    switchToCorrectNetwork,
    isConnecting,
  } = useWallet();
  const chainConfig =
    CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG];

  const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createDbMutation = useCreateEscrowDb();

  const {
    control,
    reset: resetForm,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      projectTitle: "",
      scopeOfWork: "",
      useMilestones: false,
      fundImmediately: false,
      totalAmount: 0,
      milestones: [{ title: "", description: "", amount: 0 }],
    },
  });

  const {
    fields: milestoneFields,
    append: addMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control: control,
    name: "milestones",
  });

  const useMilestones =
    useWatch({
      control: control,
      name: "useMilestones",
    }) || false;

  const watchedMilestones =
    useWatch({
      control: control,
      name: "milestones",
    }) || [];

  const formTotalAmount =
    useWatch({
      control: control,
      name: "totalAmount",
    }) || 0;

  const totalAmount = useMilestones
    ? watchedMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
    : Number(formTotalAmount);

  const protocolFee = totalAmount * 0.03;
  const netAmount = totalAmount - protocolFee;

  const generatedLink = createdEscrowId
    ? `${window.location.origin}/pay/${createdEscrowId}`
    : null;

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const contractMilestones =
        data.useMilestones && data.milestones
          ? data.milestones.map((m) => ({
              title: m.title || "Untitled Milestone",
              description: m.description || "",
              amount: m.amount || 0,
            }))
          : [
              {
                title: "Full Project",
                description: "Standard single payment",
                amount: totalAmount,
              },
            ];

      const dbRes = await createDbMutation.mutateAsync({
        freelancerAddress: address,
        projectTitle: data.projectTitle,
        scopeOfWork: data.scopeOfWork,
        totalAmount: totalAmount,
        milestones: contractMilestones,
      });

      setCreatedEscrowId(dbRes.escrow.id);
      toast.success("Payment link generated!");
    } catch {
      toast.error("Failed to initialize escrow");
    }
  };

  function handleCreateAnother() {
    resetForm({
      projectTitle: "",
      scopeOfWork: "",
      useMilestones: false,
      fundImmediately: false,
      totalAmount: 0,
      milestones: [{ title: "", description: "", amount: 0 }],
    });

    setCreatedEscrowId(null);
    createDbMutation.reset();
  }

  async function handleCopyLink() {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Hydration check
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (generatedLink) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-border bg-secondary p-8 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-accent/20">
            <Check className="size-8 text-accent" />
          </div>

          <h1 className="text-2xl font-semibold text-white">
            Payment Link Generated!
          </h1>
          <p className="mt-2 text-secondary-foreground">
            Share this secure payment link with your client to collect funds.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded bg-secondary px-3 py-2 text-sm text-primary break-all">
                {generatedLink}
              </span>
              <Button
                onClick={handleCopyLink}
                className="bg-primary/80 hover:bg-primary text-white shrink-0"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-secondary-foreground">
                  Total Amount
                </p>
                <p className="text-lg font-semibold text-white">
                  {formatUSDC(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-foreground">You Receive</p>
                <p className="text-lg font-semibold text-accent">
                  {formatUSDC(netAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-secondary-foreground">
                Your client will pay with USDC on{" "}
                {chainConfig?.name || "Polygon"}. Once funded, the escrow will
                be secured by smart contract until you complete the work.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/escrows" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-border text-secondary-foreground hover:text-white"
              >
                View All Escrows
              </Button>
            </Link>
            <Button
              onClick={handleCreateAnother}
              className="flex-1 bg-primary/80 hover:bg-primary text-white"
            >
              Create Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/escrows"
          className="inline-flex items-center text-sm text-secondary-foreground hover:text-white mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Escrows
        </Link>
        <h1 className="text-2xl font-semibold text-white">
          Create Payment Request
        </h1>
        <p className="mt-1 text-sm text-secondary-foreground">
          Generate a secure escrow link to share with your client for payment
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 rounded-xl border border-tb-warning/30 bg-tb-warning/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-tb-warning" />
              <p className="text-sm text-tb-warning">
                Connect your wallet to create payment requests
              </p>
            </div>
            <Button
              onClick={connect}
              disabled={isConnecting}
              size="sm"
              className="bg-tb-warning/80 hover:bg-tb-warning text-black"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-destructive" />
              <p className="text-sm text-chart-4/80">
                Please switch to {chainConfig?.name || "Polygon"} network
              </p>
            </div>
            <Button
              onClick={switchToCorrectNetwork}
              size="sm"
              className="bg-destructive/80 hover:bg-destructive text-white"
            >
              Switch Network
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-8">
        {/* Project Details */}
        <div className="rounded-xl border border-border bg-secondary p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Project Details
          </h2>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="projectTitle"
                className="text-secondary-foreground"
              >
                Project Title
              </Label>
              <Input
                id="projectTitle"
                placeholder="e.g., E-commerce Platform Development"
                {...register("projectTitle")}
                className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                disabled={!isConnected || isSubmitting}
              />
              {errors.projectTitle && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.projectTitle.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="scopeOfWork"
                className="text-secondary-foreground"
              >
                Scope of Work
              </Label>
              <Textarea
                id="scopeOfWork"
                placeholder="Describe the deliverables and expectations..."
                {...register("scopeOfWork")}
                className="mt-1.5 min-h-30 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                disabled={!isConnected || isSubmitting}
              />
              {errors.scopeOfWork && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.scopeOfWork.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Structure */}
        <div className="rounded-xl border border-border bg-secondary p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">
              Payment Structure
            </h2>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="useMilestones"
                className="text-sm text-secondary-foreground"
              >
                Use Milestones
              </Label>
              <Controller
                control={control}
                name="useMilestones"
                render={({ field }) => (
                  <Switch
                    id="useMilestones"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {useMilestones ? (
            <div className="space-y-4">
              {milestoneFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Milestone {index + 1}
                    </span>
                    {milestoneFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        disabled={isSubmitting}
                        className="size-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-400/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Input
                        placeholder="Milestone title"
                        {...register(`milestones.${index}.title` as const)}
                        className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                        disabled={!isConnected || isSubmitting}
                      />
                      {errors.milestones?.[index]?.title && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.milestones[index]?.title?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Amount (USDC)"
                        {...register(`milestones.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                        step="0.01"
                        disabled={!isConnected || isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Input
                      placeholder="Description (optional)"
                      {...register(`milestones.${index}.description` as const)}
                      className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                      disabled={!isConnected || isSubmitting}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addMilestone({ title: "", description: "", amount: 0 })
                }
                className="w-full border-dashed border-border text-secondary-foreground hover:text-white hover:border-primary"
                disabled={!isConnected || isSubmitting}
              >
                <Plus className="mr-2 size-4" />
                Add Milestone
              </Button>
            </div>
          ) : (
            <div>
              <Label
                htmlFor="totalAmount"
                className="text-secondary-foreground"
              >
                Total Amount (USDC)
              </Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("totalAmount", { valueAsNumber: true })}
                className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                disabled={!isConnected || isSubmitting}
              />
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.totalAmount.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {totalAmount > 0 && (
          <div className="rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">Total Amount</span>
                <span className="font-medium text-white">
                  {formatUSDC(totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-foreground">
                  Protocol Fee (3%)
                </span>
                <span className="text-secondary-foreground">
                  -{formatUSDC(protocolFee)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">You Receive</span>
                  <span className="text-lg font-semibold text-accent">
                    {formatUSDC(netAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/escrows" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-secondary-foreground hover:text-white"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !isConnected ||
              !isCorrectNetwork ||
              totalAmount <= 0
            }
            className="flex-1 bg-primary/80 hover:bg-primary text-white disabled:opacity-50"
          >
            {isSubmitting ? "Generating Link..." : "Generate Payment Link"}
          </Button>
        </div>
      </form>
    </div>
  );
}
