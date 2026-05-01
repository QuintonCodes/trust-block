"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Settings,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGetUser, useUpdateUser } from "@/lib/api/hooks/use-user";
import { SettingsFormValues, settingsSchema } from "@/lib/types";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { truncateAddress } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

export default function SettingsPage() {
  const {
    address,
    isConnected,
    isMounted,
    connect,
    isCorrectNetwork,
    switchToCorrectNetwork,
    networkName,
  } = useWallet();

  const [copied, setCopied] = useState(false);

  const { data: user, isLoading: isUserLoading } = useGetUser(address);
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: "onChange",
    defaultValues: {
      role: "WORKER",
      displayName: "",
      bio: "",
      notifications: {
        emailDeposits: true,
        emailPayouts: true,
        emailMilestones: true,
        browserNotifications: false,
      },
    },
  });

  const currentRole =
    useWatch({
      control: control,
      name: "role",
    }) || "WORKER";

  const chainConfig =
    CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG];

  useEffect(() => {
    if (user) {
      reset({
        role: user.role || "WORKER",
        displayName: user.displayName || "",
        bio: user.bio || "",
        notifications: {
          emailDeposits: true,
          emailPayouts: true,
          emailMilestones: true,
          browserNotifications: false,
        },
      });
    }
  }, [user, reset]);

  async function handleCopyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    if (!address) return;
    try {
      await updateUser({
        address,
        data: {
          role: data.role,
          displayName: data.displayName,
          bio: data.bio,
        },
      });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to update settings. Please try again.");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-secondary">
          <Settings className="size-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Connect Your Wallet
        </h2>
        <p className="max-w-md text-secondary-foreground">
          Please connect your wallet using the button in the top right corner to
          access and manage your profile, roles, and platform settings.
        </p>
      </div>
    );
  }

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-4 text-secondary-foreground">
          Loading your settings...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="mt-1 text-sm text-secondary-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          type="submit"
          disabled={isUpdating}
          className="text-white bg-primary/80 hover:bg-primary"
        >
          {isUpdating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Check className="mr-2 size-4" />
          )}
          {isUpdating ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* Account Type Selection */}
      <div className="p-6 border rounded-xl border-border bg-secondary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-chart-5/10">
            <Users className="size-5 text-chart-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Account Type</h2>
            <p className="text-sm text-secondary-foreground">
              Choose how you primarily use TrustBlock
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Worker Option */}
          <button
            onClick={() => setValue("role", "WORKER", { shouldDirty: true })}
            className={`relative rounded-xl border-2 p-6 text-left transition-all ${
              currentRole === "WORKER"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            {currentRole === "WORKER" && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-primary" />
              </div>
            )}
            <div className="p-2 mb-3 rounded-lg bg-primary/20 w-fit">
              <Briefcase className="size-5 text-primary" />
            </div>
            <h3 className="font-medium text-white">Worker / Freelancer</h3>
            <p className="mt-1 text-sm text-secondary-foreground">
              Create escrows, send payment links to clients, and receive funds
              for completed work
            </p>
            <ul className="mt-3 space-y-1 text-xs text-secondary-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Create payment requests
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Submit milestones for review
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Receive secured payments
              </li>
            </ul>
          </button>

          {/* Client Option */}
          <button
            onClick={() => setValue("role", "CLIENT", { shouldDirty: true })}
            className={`relative rounded-xl border-2 p-6 text-left transition-all ${
              currentRole === "CLIENT"
                ? "border-accent bg-accent/10"
                : "border-border bg-background hover:border-accent/50"
            }`}
          >
            {currentRole === "CLIENT" && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-accent" />
              </div>
            )}
            <div className="p-2 mb-3 rounded-lg bg-accent/20 w-fit">
              <Users className="size-5 text-accent" />
            </div>
            <h3 className="font-medium text-white">Client</h3>
            <p className="mt-1 text-sm text-secondary-foreground">
              Deposit funds into escrows, review work, and approve milestone
              releases
            </p>
            <ul className="mt-3 space-y-1 text-xs text-secondary-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Fund escrow contracts
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Review & approve work
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-accent" />
                Release funds on completion
              </li>
            </ul>
          </button>
        </div>

        <div className="p-4 mt-4 border rounded-lg border-tb-warning/30 bg-tb-warning/5">
          <p className="text-sm text-tb-warning">
            <strong>Note:</strong> You can use TrustBlock as both a worker and
            client. This setting controls your default dashboard view and which
            features are prominently displayed.
          </p>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="p-6 border rounded-xl border-border bg-secondary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wallet className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Wallet</h2>
            <p className="text-sm text-secondary-foreground">
              Your connected Web3 wallet
            </p>
          </div>
        </div>

        {isConnected && address ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg border-border bg-background">
              <div>
                <p className="text-sm text-secondary-foreground">
                  Connected Address
                </p>
                <span className="text-base text-white">
                  {truncateAddress(address, 10, 8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="text-secondary-foreground hover:text-white"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `${chainConfig?.explorer || "https://polygonscan.com"}/address/${address}`,
                      "_blank",
                    )
                  }
                  className="text-secondary-foreground hover:text-white"
                >
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-border bg-background">
              <div>
                <p className="text-sm text-secondary-foreground">Network</p>
                <p
                  className="font-medium text-white"
                  style={{ color: chainConfig?.color }}
                >
                  {networkName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isCorrectNetwork ? (
                  <>
                    <div className="rounded-full size-2 bg-accent" />
                    <span className="text-sm text-accent">Connected</span>
                  </>
                ) : (
                  <Button
                    onClick={switchToCorrectNetwork}
                    size="sm"
                    className="text-black bg-tb-warning/80 hover:bg-tb-warning"
                  >
                    Switch Network
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-secondary-foreground">
              Connect your wallet to access all features
            </p>
            <Button
              onClick={connect}
              className="text-white bg-primary/80 hover:bg-primary"
            >
              <Wallet className="mr-2 size-4" />
              Connect Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Profile Settings */}
      <div className="p-6 border rounded-xl border-border bg-secondary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <User className="size-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-secondary-foreground">
              Your public profile information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-secondary-foreground">
              Display Name
            </Label>
            <Input
              id="displayName"
              placeholder={
                currentRole === "WORKER"
                  ? "e.g., Acme Dev Studio"
                  : "e.g., TechCorp Inc."
              }
              {...register("displayName")}
              className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bio" className="text-secondary-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder={
                currentRole === "WORKER"
                  ? "Tell clients about your services..."
                  : "Describe the type of projects you are looking for..."
              }
              {...register("bio")}
              className="mt-1.5 min-h-25 border-border bg-background text-white placeholder:text-secondary-foreground/50"
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-destructive">
                {errors.bio.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-6 border rounded-xl border-border bg-secondary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-tb-warning/10">
            <Bell className="size-5 text-tb-warning" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Notifications</h2>
            <p className="text-sm text-secondary-foreground">
              Manage your notification preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-white">Deposit Notifications</p>
              <p className="text-sm text-secondary-foreground">
                {currentRole === "WORKER"
                  ? "Get notified when a client deposits funds"
                  : "Confirm your deposit was successful"}
              </p>
            </div>
            <Controller
              name="notifications.emailDeposits"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-white">
                {currentRole === "WORKER"
                  ? "Payout Notifications"
                  : "Release Notifications"}
              </p>
              <p className="text-sm text-secondary-foreground">
                {currentRole === "WORKER"
                  ? "Get notified when funds are released to you"
                  : "Get notified when funds are released"}
              </p>
            </div>
            <Controller
              name="notifications.emailPayouts"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-white">Milestone Updates</p>
              <p className="text-sm text-secondary-foreground">
                {currentRole === "WORKER"
                  ? "Get notified when milestones are approved"
                  : "Get notified when work is submitted for review"}
              </p>
            </div>
            <Controller
              name="notifications.emailMilestones"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-white">Browser Notifications</p>
              <p className="text-sm text-secondary-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Controller
              name="notifications.browserNotifications"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="p-6 border rounded-xl border-border bg-secondary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Shield className="size-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Security</h2>
            <p className="text-sm text-secondary-foreground">
              Security settings and information
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-lg border-border bg-background">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/20 p-1.5 mt-0.5">
              <Check className="size-3.5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-white">
                Sign-In with Ethereum (SIWE)
              </p>
              <p className="mt-1 text-sm text-secondary-foreground">
                Your wallet address is your identity. No passwords needed - your
                cryptographic signature proves ownership.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 mt-4 border rounded-lg border-tb-warning/30 bg-tb-warning/5">
          <p className="text-sm text-tb-warning">
            <strong>Important:</strong> Never share your wallet&apos;s private
            key or seed phrase with anyone. TrustBlock will never ask for this
            information.
          </p>
        </div>
      </div>
    </form>
  );
}
