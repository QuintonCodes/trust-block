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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEscrowDb } from "@/lib/api/hooks/use-escrows-mutations";
import { CreateEscrowFormValues, createEscrowSchema } from "@/lib/types";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { formatUSDC } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

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
  } = useForm<CreateEscrowFormValues>({
    resolver: zodResolver(createEscrowSchema),
    mode: "onChange",
    defaultValues: {
      projectTitle: "",
      scopeOfWork: "",
      dueDate: "",
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

  const onSubmit: SubmitHandler<CreateEscrowFormValues> = async (data) => {
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

      const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

      const dbRes = await createDbMutation.mutateAsync({
        freelancerAddress: address,
        projectTitle: data.projectTitle,
        scopeOfWork: data.scopeOfWork,
        totalAmount: totalAmount,
        dueDate,
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
      dueDate: "",
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
      <div className="max-w-2xl mx-auto">
        <div className="p-8 text-center border rounded-xl border-border bg-secondary">
          <div className="flex items-center justify-center mx-auto mb-6 rounded-full size-16 bg-accent/20">
            <Check className="size-8 text-accent" />
          </div>

          <h1 className="text-2xl font-semibold text-white">
            Payment Link Generated!
          </h1>
          <p className="mt-2 text-secondary-foreground">
            Share this secure payment link with your client to collect funds.
          </p>

          <div className="p-4 mt-6 border rounded-lg border-border bg-background">
            <div className="flex items-center gap-2">
              <span className="flex-1 px-3 py-2 text-sm break-all rounded bg-secondary text-primary">
                {generatedLink}
              </span>
              <Button
                onClick={handleCopyLink}
                className="text-white bg-primary/80 hover:bg-primary shrink-0"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 mt-6 border rounded-lg border-border bg-background">
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
            <div className="pt-3 mt-4 border-t border-border">
              <p className="text-xs text-secondary-foreground">
                Your client will pay with USDC on{" "}
                {chainConfig?.name || "Polygon"}. Once funded, the escrow will
                be secured by smart contract until you complete the work.
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
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
              className="flex-1 text-white bg-primary/80 hover:bg-primary"
            >
              Create Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/escrows"
          className="inline-flex items-center mb-4 text-sm text-secondary-foreground hover:text-white"
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
        <div className="p-4 mb-6 border rounded-xl border-tb-warning/30 bg-tb-warning/10">
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
              className="text-black bg-tb-warning/80 hover:bg-tb-warning"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div className="p-4 mb-6 border rounded-xl border-destructive/30 bg-destructive/10">
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
              className="text-white bg-destructive/80 hover:bg-destructive"
            >
              Switch Network
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-8">
        {/* Project Details */}
        <div className="p-6 border rounded-xl border-border bg-secondary">
          <h2 className="mb-4 text-lg font-medium text-white">
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

            <div>
              <Label htmlFor="dueDate" className="text-secondary-foreground">
                Project Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="mt-1.5 border-border bg-background text-white"
                disabled={!isConnected || isSubmitting}
              />
              <p className="mt-1 text-xs text-secondary-foreground">
                When do you expect the project to be completed? This helps set
                client expectations.
              </p>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Structure */}
        <div className="p-6 border rounded-xl border-border bg-secondary">
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
                  className="p-4 border rounded-lg border-border bg-background"
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
                        className="p-0 text-red-400 size-8 hover:text-red-500 hover:bg-red-400/10"
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
                        className="text-white border-border bg-secondary placeholder:text-secondary-foreground/50"
                        disabled={!isConnected || isSubmitting}
                      />
                      {errors.milestones?.[index]?.title && (
                        <p className="mt-1 text-xs text-destructive">
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
                        className="text-white border-border bg-secondary placeholder:text-secondary-foreground/50"
                        step="0.01"
                        disabled={!isConnected || isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Input
                      placeholder="Description (optional)"
                      {...register(`milestones.${index}.description` as const)}
                      className="text-white border-border bg-secondary placeholder:text-secondary-foreground/50"
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
          <div className="p-6 border rounded-xl border-border bg-secondary">
            <h2 className="mb-4 text-lg font-medium text-white">Summary</h2>
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
              <div className="pt-3 border-t border-border">
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
            className="flex-1 text-white bg-primary/80 hover:bg-primary disabled:opacity-50"
          >
            {isSubmitting ? "Generating Link..." : "Generate Payment Link"}
          </Button>
        </div>
      </form>
    </div>
  );
}
