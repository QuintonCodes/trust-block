import { http, createConfig } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Determine which network to use based on environment
const isProduction = process.env.NODE_ENV === 'production'

// TrustBlock Escrow Contract Address (placeholder for future deployment)
// Production: Polygon Mainnet
// Development: Polygon Amoy Testnet
export const ESCROW_CONTRACT_ADDRESS = isProduction
  ? '0x0000000000000000000000000000000000000000' as const // Replace with mainnet address
  : '0x0000000000000000000000000000000000000000' as const // Replace with testnet address

// USDC Contract Addresses
export const USDC_CONTRACT_ADDRESS = {
  [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const, // Native USDC on Polygon
  [polygonAmoy.id]: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' as const, // Test USDC on Amoy
} as const

// Wagmi configuration
export const config = createConfig({
  chains: isProduction ? [polygon] : [polygonAmoy, polygon],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [polygon.id]: http('https://polygon-rpc.com'),
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
  },
})

// Chain configuration for display
export const CHAIN_CONFIG = {
  [polygon.id]: {
    name: 'Polygon',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  [polygonAmoy.id]: {
    name: 'Polygon Amoy',
    symbol: 'MATIC',
    explorer: 'https://amoy.polygonscan.com',
    color: '#8247E5',
  },
} as const

// Get the primary chain based on environment
export const PRIMARY_CHAIN = isProduction ? polygon : polygonAmoy
export const PRIMARY_CHAIN_ID = PRIMARY_CHAIN.id
