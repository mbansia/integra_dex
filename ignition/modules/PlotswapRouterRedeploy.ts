import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Router-only redeploy. Re-uses the EXISTING factory + WIRL on Integra
// testnet — they are not redeployed. All 8 existing pairs and every LP
// position on those pairs continue to work, since pairs reference the
// factory (immutable) not the router.
//
// Defaults pin the current testnet addresses; override via parameters
// if redeploying against a different network or bootstrapping a fork.
//
//   npx hardhat ignition deploy ignition/modules/PlotswapRouterRedeploy.ts \
//     --network integra-testnet \
//     --parameters '{"PlotswapRouterRedeploy":{"factory":"0x...","wirl":"0x..."}}'
//
// On success, the deployment id "PlotswapRouterRedeploy" pins the new
// router address in ignition/deployments/<chainId>/...
export default buildModule("PlotswapRouterRedeploy", (m) => {
  const factory = m.getParameter(
    "factory",
    "0x5a9E1b7634F36f5E8752160c018e1cF1e8ED5C1d",
  );
  const wirl = m.getParameter(
    "wirl",
    "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34",
  );

  const router = m.contract("PlotswapRouter", [factory, wirl]);

  return { router };
});
