import { createConfig, http } from "wagmi";
import { hardhat, polygon, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Determine which network to use based on environment
const isProduction = process.env.NODE_ENV === "production";

// PRIMARY_CHAIN_ID dynamically switches based on your environment
export const PRIMARY_CHAIN_ID = isProduction ? polygon.id : hardhat.id;

// TrustBlock Escrow Contract Address
export const ESCROW_CONTRACT_ADDRESS = isProduction
  ? "0x..." // TODO: Add real deployment address later
  : "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// USDC Contract Addresses
export const USDC_CONTRACT_ADDRESS = {
  [polygon.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const, // Native USDC on Polygon
  [polygonAmoy.id]: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" as const, // Test USDC on Amoy
  [hardhat.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
} as const;

// Wagmi configuration
export const config = createConfig({
  chains: isProduction ? [polygon] : [hardhat, polygonAmoy, polygon],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [polygon.id]: http("https://polygon-rpc.com"),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

// Chain configuration for display
export const CHAIN_CONFIG = {
  [polygon.id]: {
    name: "Polygon",
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
    color: "#8247E5",
  },
  [polygonAmoy.id]: {
    name: "Polygon Amoy",
    symbol: "MATIC",
    explorer: "https://amoy.polygonscan.com",
    color: "#8247E5",
  },
  [hardhat.id]: {
    name: "Hardhat",
    symbol: "ETH",
    explorer: "http://127.0.0.1:8545",
    color: "#8247E5",
  },
} as const;
