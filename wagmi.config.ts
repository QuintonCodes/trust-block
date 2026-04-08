import { defineConfig } from "@wagmi/cli";
import { hardhat, react } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/lib/web3/generated.ts",
  contracts: [],
  plugins: [
    hardhat({
      project: ".",
    }),
    react(),
  ],
});
