"use client";

import {
  AlertCircle,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CHAIN_CONFIG, PRIMARY_CHAIN_ID } from "@/lib/web3/config";
import { truncateAddress } from "@/lib/web3/utils";
import { useWallet } from "@/lib/web3/wallet-context";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Active Escrows", href: "/escrows" },
  { name: "Transaction History", href: "/transactions" },
  { name: "Settings", href: "/settings" },
];

export function Header() {
  const pathname = usePathname();

  const {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    isCorrectNetwork,
    networkName,
    switchToCorrectNetwork,
  } = useWallet();

  const chainConfig =
    CHAIN_CONFIG[PRIMARY_CHAIN_ID as keyof typeof CHAIN_CONFIG];

  async function handleCopyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  }

  const headerTitle = navigation.find(
    (nav) =>
      pathname === nav.href ||
      (nav.href !== "/" && pathname.startsWith(nav.href)),
  )?.name;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium text-white">{headerTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && address ? (
          <>
            {!isCorrectNetwork && (
              <Button
                onClick={switchToCorrectNetwork}
                size="sm"
                className="bg-tb-warning/80 hover:bg-tb-warning text-black"
              >
                <AlertCircle className="mr-2 size-4" />
                Switch to {chainConfig?.name || "Polygon"}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-border bg-secondary hover:bg-border text-white"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2 rounded-full ${isCorrectNetwork ? "bg-accent" : "bg-tb-warning"}`}
                    />
                    <span className="text-sm">{truncateAddress(address)}</span>
                    <ChevronDown className="size-4 text-secondary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-border bg-secondary"
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-secondary-foreground">
                    Connected to
                  </p>
                  <p
                    className={`text-sm font-medium ${isCorrectNetwork ? "text-accent" : "text-tb-warning"}`}
                  >
                    {networkName}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleCopyAddress}
                  className="text-secondary-foreground hover:text-white focus:text-white focus:bg-border"
                >
                  <Copy className="mr-2 size-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `${chainConfig?.explorer || "https://polygonscan.com"}/address/${address}`,
                      "_blank",
                    )
                  }
                  className="text-secondary-foreground hover:text-white focus:text-white focus:bg-border"
                >
                  <ExternalLink className="mr-2 size-4" />
                  View on Explorer
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={disconnect}
                  className="text-red-500 group-hover:text-red-600 focus:text-red-600 focus:bg-border"
                >
                  <LogOut className="mr-2 size-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="bg-primary/80 hover:bg-primary text-white"
          >
            <Wallet className="mr-2 size-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
    </header>
  );
}
