import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";

dotenv.config();

// Import custom tasks
import "./tasks/deploy-sepolia.js";
import "./tasks/simple-deploy.js";
import "./tasks/deploy-contracts.js";
import "./tasks/deploy-modularized.js";
import "./tasks/deploy-celo-sepolia.js";
import "./tasks/deploy-modularized-and-update.js";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 0,
        details: {
          yul: true,
          yulDetails: {
            optimizerSteps: 'dhfoDgvlFnTUtnIfxxxxxxx'
          }
        }
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    // Celo Mainnet
    celo: {
      url: process.env.CELO_MAINNET_RPC || "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
    },
    // Celo Sepolia Testnet
    celoSepolia: {
      url: process.env.CELO_SEPOLIA_RPC || "https://rpc.ankr.com/celo_sepolia",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      allowUnlimitedContractSize: true,
      timeout: 300000,
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "", // Ethereum Sepolia
      celoSepolia: process.env.CELOSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "", // Celo Sepolia
      celo: process.env.CELOSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "", // Celo Mainnet
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ]
  },
  sourcify: {
    enabled: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
