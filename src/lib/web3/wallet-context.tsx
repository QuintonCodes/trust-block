"use client";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  useChainId,
  useConnect,
  useConnection,
  useConnectionEffect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
  WagmiProvider,
} from "wagmi";

import { syncUserLogin } from "@/actions/user";
import { CHAIN_CONFIG, config, PRIMARY_CHAIN_ID } from "./config";

// ============ Wallet Hook ============
type WalletContextType = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  isMounted: boolean;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  networkName: string;
  networkColor: string;
  connect: () => void;
  disconnect: () => void;
  switchToCorrectNetwork: () => void;
  error: Error | null;
};

// ============ Transaction Status Types ============
export type TransactionStatus =
  | "idle"
  | "awaiting-signature" // Waiting for user to sign in MetaMask
  | "pending" // Transaction submitted, waiting for block confirmation
  | "confirming" // Transaction in block, waiting for confirmations
  | "confirmed" // Transaction confirmed
  | "error"; // Transaction failed

export type TransactionState = {
  status: TransactionStatus;
  hash?: `0x${string}`;
  error?: Error;
};

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const WalletContext = createContext<WalletContextType | null>(null);

function WalletContextInner({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  const { address, isConnected, isConnecting } = useConnection();
  const chainId = useChainId();
  const connectors = useConnectors();

  const { mutate: connectMutation, error: connectError } = useConnect();
  const { mutate: disconnectMutation } = useDisconnect();
  const { mutate: switchChainMutation, error: switchError } = useSwitchChain();

  const { mutate: syncLogin } = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await syncUserLogin(walletAddress);
      if (!response.success) throw new Error(response.error);
      return response.user;
    },
  });

  const isCorrectNetwork = chainId === PRIMARY_CHAIN_ID;
  const currentChainConfig = chainId
    ? CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG]
    : undefined;

  // 1. Resolve Hydration Mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 2. Sync User to Database
  useEffect(() => {
    if (isMounted && isConnected && address) {
      syncLogin(address);
    }
  }, [isMounted, isConnected, address, syncLogin]);

  // 3. Listen for external wallet disconnects
  useConnectionEffect({
    onDisconnect() {
      console.log("Wallet disconnected externally");
      toast.error("Wallet disconnected. Please check MetaMask.");
      disconnectMutation();
    },
  });

  function handleConnect() {
    const metaMaskConnector = connectors.find(
      (c) => c.id === "metaMask" || c.id === "injected",
    );

    if (!metaMaskConnector) {
      toast.error("MetaMask not found. Please install the extension.");
      return;
    }

    connectMutation(
      { connector: metaMaskConnector },
      {
        onSuccess: () => {
          toast.success("Wallet connected successfully");
        },
        onError: (err) => {
          console.error("Wallet connection error:", err);

          // If MetaMask is in a weird ghost state, force a disconnect to clear cache
          disconnectMutation();

          if (
            err.message.includes("Failed to connect") ||
            err.message.includes("User rejected")
          ) {
            toast.error(
              "Connection failed. Please unlock or restart MetaMask.",
            );
          } else {
            toast.error("Could not connect to wallet. Please try again.");
          }
        },
      },
    );
  }

  function handleSwitchNetwork() {
    switchChainMutation(
      { chainId: PRIMARY_CHAIN_ID },
      {
        onError: (err) => {
          console.error("Network switch error:", err);
          toast.error("Failed to switch network in MetaMask.");
        },
      },
    );
  }

  function handleDisconnect() {
    disconnectMutation(undefined, {
      onSuccess: () => {
        toast.success("Wallet disconnected");
      },
    });
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        isMounted,
        chainId,
        isCorrectNetwork,
        networkName: currentChainConfig?.name || `Unknown Network`,
        networkColor: currentChainConfig?.color || "#94a3b8",
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchToCorrectNetwork: handleSwitchNetwork,
        error: connectError || switchError || null,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ============ Provider Component ============
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletContextInner>{children}</WalletContextInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ============ Hook ============
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Helper to get user-friendly status message
export function getTransactionStatusMessage(status: TransactionStatus): string {
  switch (status) {
    case "idle":
      return "Ready";
    case "awaiting-signature":
      return "Please confirm in your wallet...";
    case "pending":
      return "Transaction submitted. Waiting for confirmation...";
    case "confirming":
      return "Confirming transaction...";
    case "confirmed":
      return "Transaction confirmed!";
    case "error":
      return "Transaction failed";
    default:
      return "Unknown status";
  }
}
