"use client";

import {
  Bell,
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { mockUser } from "@/lib/mock-data";
import type { UserRole } from "@/lib/types";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { truncateAddress } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

export default function SettingsPage() {
  const {
    address,
    isConnected,
    connect,
    isCorrectNetwork,
    switchToCorrectNetwork,
    networkName,
  } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    displayName: mockUser.displayName || "",
    bio: mockUser.bio || "",
  });

  const [userRole, setUserRole] = useState<UserRole>(mockUser.role);

  const [notifications, setNotifications] = useState({
    emailDeposits: true,
    emailPayouts: true,
    emailMilestones: true,
    browserNotifications: false,
  });

  const chainConfig =
    CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG];

  async function handleCopyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSaveProfile() {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Profile updated successfully");
  }

  function handleRoleChange(role: UserRole) {
    setUserRole(role);
    toast.success(
      `Account type changed to ${role === "WORKER" ? "Worker" : "Client"}`,
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-secondary-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Type Selection */}
      <div className="rounded-xl border border-border bg-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-chart-5/10 p-2">
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
            onClick={() => handleRoleChange("WORKER")}
            className={`relative rounded-xl border-2 p-6 text-left transition-all ${
              userRole === "WORKER"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            {userRole === "WORKER" && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-primary" />
              </div>
            )}
            <div className="rounded-lg bg-primary/20 p-2 w-fit mb-3">
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
            onClick={() => handleRoleChange("CLIENT")}
            className={`relative rounded-xl border-2 p-6 text-left transition-all ${
              userRole === "CLIENT"
                ? "border-accent bg-accent/10"
                : "border-border bg-background hover:border-accent/50"
            }`}
          >
            {userRole === "CLIENT" && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-accent" />
              </div>
            )}
            <div className="rounded-lg bg-accent/20 p-2 w-fit mb-3">
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

        <div className="mt-4 p-4 rounded-lg border border-tb-warning/30 bg-tb-warning/5">
          <p className="text-sm text-tb-warning">
            <strong>Note:</strong> You can use TrustBlock as both a worker and
            client. This setting controls your default dashboard view and which
            features are prominently displayed.
          </p>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="rounded-xl border border-border bg-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
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
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
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

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
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
                    <div className="size-2 rounded-full bg-accent" />
                    <span className="text-sm text-accent">Connected</span>
                  </>
                ) : (
                  <Button
                    onClick={switchToCorrectNetwork}
                    size="sm"
                    className="bg-tb-warning/80 hover:bg-tb-warning text-black"
                  >
                    Switch Network
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-secondary-foreground mb-4">
              Connect your wallet to access all features
            </p>
            <Button
              onClick={connect}
              className="bg-primary/80 hover:bg-primary text-white"
            >
              <Wallet className="mr-2 size-4" />
              Connect Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Profile Settings */}
      <div className="rounded-xl border border-border bg-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-accent/10 p-2">
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
                userRole === "WORKER"
                  ? "e.g., Acme Dev Studio"
                  : "e.g., TechCorp Inc."
              }
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="mt-1.5 border-border bg-background text-white placeholder:text-secondary-foreground/50"
            />
          </div>

          <div>
            <Label htmlFor="bio" className="text-secondary-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder={
                userRole === "WORKER"
                  ? "Tell clients about your services..."
                  : "Describe the type of projects you are looking for..."
              }
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="mt-1.5 min-h-25 border-border bg-background text-white placeholder:text-secondary-foreground/50"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-primary/80 hover:bg-primary text-white"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-border bg-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-tb-warning/10 p-2">
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
                {userRole === "WORKER"
                  ? "Get notified when a client deposits funds"
                  : "Confirm your deposit was successful"}
              </p>
            </div>
            <Switch
              checked={notifications.emailDeposits}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailDeposits: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-white">
                {userRole === "WORKER"
                  ? "Payout Notifications"
                  : "Release Notifications"}
              </p>
              <p className="text-sm text-secondary-foreground">
                {userRole === "WORKER"
                  ? "Get notified when funds are released to you"
                  : "Get notified when funds are released"}
              </p>
            </div>
            <Switch
              checked={notifications.emailPayouts}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailPayouts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-white">Milestone Updates</p>
              <p className="text-sm text-secondary-foreground">
                {userRole === "WORKER"
                  ? "Get notified when milestones are approved"
                  : "Get notified when work is submitted for review"}
              </p>
            </div>
            <Switch
              checked={notifications.emailMilestones}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  emailMilestones: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-white">Browser Notifications</p>
              <p className="text-sm text-secondary-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              checked={notifications.browserNotifications}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  browserNotifications: checked,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-destructive/10 p-2">
            <Shield className="size-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Security</h2>
            <p className="text-sm text-secondary-foreground">
              Security settings and information
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/20 p-1.5 mt-0.5">
              <Check className="size-3.5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-white">
                Sign-In with Ethereum (SIWE)
              </p>
              <p className="text-sm text-secondary-foreground mt-1">
                Your wallet address is your identity. No passwords needed - your
                cryptographic signature proves ownership.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg border border-tb-warning/30 bg-tb-warning/5">
          <p className="text-sm text-tb-warning">
            <strong>Important:</strong> Never share your wallet&apos;s private
            key or seed phrase with anyone. TrustBlock will never ask for this
            information.
          </p>
        </div>
      </div>
    </div>
  );
}
