import { celo, celoAlfajores } from "wagmi/chains";
import { defineChain } from "viem";

// Define Celo Sepolia chain with the correct chain ID
const celoSepolia = defineChain({
  id: 11142220, // Actual Celo Sepolia testnet chain ID
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://sepolia.celoscan.io' },
  },
  testnet: true,
});

// Define Ethereum Sepolia chain
const sepolia = defineChain({
  id: 11155111, // Ethereum Sepolia testnet chain ID
  name: 'Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
});

// Contract configuration - addresses from the latest successful deployment
const CONTRACTS = {
  [celo.id]: {
    CrosswordBoard: {
      address: "0x7b841c609d95cbafe0771d4a05d2c0415922737b",
    },
    CrosswordCore: {
      address: "0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2",
    },
    CrosswordPrizes: {
      address: "0x754b33d8aded1c6bf4821ea68158c42b434d781f",
    },
    UserProfiles: {
      address: "0x4019cd85790a2706b0fc3bd9845c2c16742af0e5",
    },
    ConfigManager: {
      address: "0x321dcef35e3da483304226ac679b8898c4ee0807",
    },
    AdminManager: {
      address: "0x8944ffc503388174aff351cb1c6f87958d6e5bb3",
    },
    PublicCrosswordManager: {
      address: "0xdc2b0c154f48c7e235872208a6f3093647a236a7",
    },
    BoardHistory: [
      "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2", // Old Legacy Mainnet contract
      "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648"  // Previous Legacy Mainnet contract
    ]
  },
  [celoAlfajores.id]: {
    // NOTE: Copying Sepolia addresses as a fallback. These should be verified.
    CrosswordBoard: {
      address: "0x7b841c609d95cbafe0771d4a05d2c0415922737b",
    },
    CrosswordCore: {
      address: "0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2",
    },
    CrosswordPrizes: {
      address: "0x754b33d8aded1c6bf4821ea68158c42b434d781f",
    },
    UserProfiles: {
      address: "0x4019cd85790a2706b0fc3bd9845c2c16742af0e5",
    },
    ConfigManager: {
      address: "0x321dcef35e3da483304226ac679b8898c4ee0807",
    },
    AdminManager: {
      address: "0x8944ffc503388174aff351cb1c6f87958d6e5bb3",
    },
    PublicCrosswordManager: {
      address: "0xdc2b0c154f48c7e235872208a6f3093647a236a7",
    },
    BoardHistory: []
  },
  [celoSepolia.id]: {
    // Modularized contract addresses for the new architecture
    CrosswordBoard: {
      address: "0x7b841c609d95cbafe0771d4a05d2c0415922737b",
    },
    CrosswordCore: {
      address: "0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2",
    },
    CrosswordPrizes: {
      address: "0x754b33d8aded1c6bf4821ea68158c42b434d781f",
    },
    UserProfiles: {
      address: "0x4019cd85790a2706b0fc3bd9845c2c16742af0e5",
    },
    ConfigManager: {
      address: "0x321dcef35e3da483304226ac679b8898c4ee0807",
    },
    AdminManager: {
      address: "0x8944ffc503388174aff351cb1c6f87958d6e5bb3",
    },
    PublicCrosswordManager: {
      address: "0xdc2b0c154f48c7e235872208a6f3093647a236a7",
    },
    BoardHistory: [
      "0x7b841c609d95cbafe0771d4a05d2c0415922737b" // Previous Sepolia contract
    ]
  },
  [sepolia.id]: {
    // Ethereum Sepolia - Modularized contract addresses
    CrosswordBoard: {
      address: "0x0000000000000000000000000000000000000000", // To be updated by deployment script
    },
    CrosswordCore: {
      address: "0x0000000000000000000000000000000000000000",
    },
    CrosswordPrizes: {
      address: "0x0000000000000000000000000000000000000000",
    },
    UserProfiles: {
      address: "0x0000000000000000000000000000000000000000",
    },
    ConfigManager: {
      address: "0x0000000000000000000000000000000000000000",
    },
    AdminManager: {
      address: "0x0000000000000000000000000000000000000000",
    },
    PublicCrosswordManager: {
      address: "0x0000000000000000000000000000000000000000",
    },
    BoardHistory: []
  }
};

// Local dev configuration
const LOCAL_CONTRACTS = {
  CrosswordBoard: {
    address: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // This would be from local hardhat
  }
};

export { CONTRACTS, LOCAL_CONTRACTS, sepolia, celoSepolia };
