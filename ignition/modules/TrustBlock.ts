import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Real Native USDC address on Polygon Mainnet
const POLYGON_USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

// The wallet address where your 3% protocol fees will go
const MY_TREASURY_ADDRESS = "0x8fBf5C3De1E10d87d8F5a0FC763394b8Ff11E194";

export default buildModule("TrustBlockDeployment", (m) => {
  const isLocalDeploy = m.getParameter("isLocal", false);
  let usdcAddress;

  if (isLocalDeploy) {
    // DEVELOPMENT: Deploy the Mock USDC contract first
    const mockUsdc = m.contract("MockUSDC");
    usdcAddress = mockUsdc;
  } else {
    // PRODUCTION: Use the real USDC address
    usdcAddress = POLYGON_USDC_ADDRESS;
  }

  // Deploy the Escrow Contract
  const escrow = m.contract("TrustBlockEscrow", [
    usdcAddress,
    MY_TREASURY_ADDRESS,
  ]);

  return { escrow };
});
