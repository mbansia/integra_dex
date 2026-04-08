import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PlotswapDeployModule = buildModule("PlotswapDeploy", (m) => {
  const deployer = m.getAccount(0);

  // Deploy Factory
  const factory = m.contract("PlotswapFactory", [deployer]);

  // Deploy WIRL (wrapped IRL for testnet)
  const wirl = m.contract("MockERC20", ["Wrapped IRL", "WIRL", 18, 0n], {
    id: "WIRL",
  });

  // Deploy Router
  const router = m.contract("PlotswapRouter", [factory, wirl]);

  // Deploy testnet mock tokens
  const mockUSDC = m.contract(
    "MockERC20",
    ["Mock USDC", "mUSDC", 6, 1_000_000_000_000n],
    { id: "MockUSDC" }
  );

  const mockSEC = m.contract(
    "MockERC1404",
    ["Mock Security Token", "mSEC", 1_000_000_000_000_000_000_000_000n],
    { id: "MockSEC" }
  );

  return { factory, wirl, router, mockUSDC, mockSEC };
});

export default PlotswapDeployModule;
