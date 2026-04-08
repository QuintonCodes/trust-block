import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TrustBlockDeployment", (m) => {
  // 1. Deploy the Mock USDC Contract
  const mockUSDC = m.contract("MockUSDC");

  // 2. Define a Fee Treasury Address
  const feeTreasury = m.getAccount(1);

  // 3. Deploy the TrustBlock Escrow Contract
  // We pass the deployed mockUSDC address and the feeTreasury address to the constructor
  const escrow = m.contract("TrustBlockEscrow", [mockUSDC, feeTreasury]);

  return { mockUSDC, escrow };
});
