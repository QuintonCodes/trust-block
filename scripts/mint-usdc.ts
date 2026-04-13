import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  const usdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const clientAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  console.log("Minting 10,000 USDC to Client...");

  const usdc = await hre.viem.getContractAt("MockUSDC", usdcAddress);

  // Parse 10,000 with 6 decimals
  const amountToMint = parseUnits("10000", 6);

  // Execute the mint function
  const txHash = await usdc.write.mint([clientAddress, amountToMint]);

  console.log(`Transaction sent! Hash: ${txHash}`);
  console.log(`Success! 10,000 USDC minted to ${clientAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
