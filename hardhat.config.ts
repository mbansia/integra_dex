import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      viaIR: true,
    },
  },
  networks: {
    "integra-testnet": {
      url: process.env.INTEGRA_RPC_URL || "https://testnet-rpc.integralayer.com",
      chainId: 26218,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: {
      "integra-testnet": "not-needed",
    },
    customChains: [
      {
        network: "integra-testnet",
        chainId: 26218,
        urls: {
          apiURL: "https://explorer.integralayer.com/api",
          browserURL: "https://explorer.integralayer.com",
        },
      },
    ],
  },
};

export default config;
