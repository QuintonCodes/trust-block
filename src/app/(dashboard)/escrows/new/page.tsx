"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { formatUSDC } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

type Milestone = {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
};

export default function NewEscrowPage() {
  const {
    isConnected,
    connect,
    isCorrectNetwork,
    switchToCorrectNetwork,
    isConnecting,
  } = useWallet();
  const chainConfig =
    CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    projectTitle: "",
    scopeOfWork: "",
    totalAmount: "",
    useMilestones: false,
  });

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", title: "", description: "", amount: "", dueDate: "" },
  ]);

  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0,
  );
  const totalAmount = formData.useMilestones
    ? totalMilestoneAmount
    : parseFloat(formData.totalAmount) || 0;

  const protocolFee = totalAmount * 0.03;
  const netAmount = totalAmount - protocolFee;

  function updateMilestone(id: string, field: keyof Milestone, value: string) {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  }

  function addMilestone() {
    setMilestones([
      ...milestones,
      {
        id: Date.now().toString(),
        title: "",
        description: "",
        amount: "",
        dueDate: "",
      },
    ]);
  }

  function removeMilestone(id: string) {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((m) => m.id !== id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock escrow ID
    const escrowId = `esc-${Date.now().toString(36)}`;
    const link = `${window.location.origin}/pay/${escrowId}`;

    setGeneratedLink(link);
    setIsSubmitting(false);
    toast.success("Escrow created successfully!");
  }

  async function handleCopyLink() {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
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
            Share this secure payment link with your client to collect funds
          </p>

          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-sm text-secondary-foreground">
              Share this link with your client to receive payment
            </p>
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
              onClick={() => {
                setGeneratedLink(null);
                setFormData({
                  projectTitle: "",
                  scopeOfWork: "",
                  totalAmount: "",
                  useMilestones: false,
                });
                setMilestones([
                  {
                    id: "1",
                    title: "",
                    description: "",
                    amount: "",
                    dueDate: "",
                  },
                ]);
              }}
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

      <form onSubmit={handleSubmit} className="space-y-8">
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
                value={formData.projectTitle}
                onChange={(e) =>
                  setFormData({ ...formData, projectTitle: e.target.value })
                }
                className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                required
              />
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
                value={formData.scopeOfWork}
                onChange={(e) =>
                  setFormData({ ...formData, scopeOfWork: e.target.value })
                }
                className="mt-1.5 min-h-30 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                required
              />
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
              <Switch
                id="useMilestones"
                checked={formData.useMilestones}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useMilestones: checked })
                }
              />
            </div>
          </div>

          {formData.useMilestones ? (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Milestone {index + 1}
                    </span>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
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
                        value={milestone.title}
                        onChange={(e) =>
                          updateMilestone(milestone.id, "title", e.target.value)
                        }
                        className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Amount (USDC)"
                        value={milestone.amount}
                        onChange={(e) =>
                          updateMilestone(
                            milestone.id,
                            "amount",
                            e.target.value,
                          )
                        }
                        className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Input
                      placeholder="Description (optional)"
                      value={milestone.description}
                      onChange={(e) =>
                        updateMilestone(
                          milestone.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="border-border bg-secondary text-white placeholder:text-secondary-foreground/50"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMilestone}
                className="w-full border-dashed border-border text-secondary-foreground hover:text-white hover:border-primary"
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
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, totalAmount: e.target.value })
                }
                className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
                min="0"
                step="0.01"
                required
              />
            </div>
          )}
        </div>

        {/* Summary */}
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
              totalAmount === 0
            }
            className="flex-1 bg-primary/80 hover:bg-primary text-white disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Generate Payment Link"}
          </Button>
        </div>
      </form>
    </div>
  );
}
