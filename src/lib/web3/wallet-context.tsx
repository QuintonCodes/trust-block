"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import {
  useChainId,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
  WagmiProvider,
} from "wagmi";

import { CHAIN_CONFIG, config, PRIMARY_CHAIN_ID } from "./config";

// ============ Wallet Hook ============
type WalletContextType = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
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
  const { address, isConnected, isConnecting } = useConnection();
  const chainId = useChainId();
  const connectors = useConnectors();
  const { mutate: connect, error: connectError } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, error: switchError } = useSwitchChain();

  const isCorrectNetwork = chainId === PRIMARY_CHAIN_ID;
  const currentChainConfig = chainId
    ? CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG]
    : undefined;

  function handleConnect() {
    const metaMaskConnector = connectors.find((c) => c.id === "metaMask");
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  }

  function handleSwitchNetwork() {
    switchChain({ chainId: PRIMARY_CHAIN_ID });
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
        isCorrectNetwork,
        networkName: currentChainConfig?.name || `Unknown Network`,
        networkColor: currentChainConfig?.color || "#94a3b8",
        connect: handleConnect,
        disconnect,
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
