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
      address: "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648", // Mainnet deployment - Dec 2025
    },
    BoardHistory: [
      "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2", // Old Legacy Mainnet contract
      "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648"  // Current Mainnet contract (will move to history on next deploy)
    ]
  },
  [celoAlfajores.id]: {
    CrosswordBoard: {
      address: process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS || "0x0000000000000000000000000000000000000000",
    },
    BoardHistory: [] // Add Alfajores history if needed
  },
  [celoSepolia.id]: {
    // Modularized contract addresses for the new architecture
    CrosswordBoard: {
      address: "0xd262287e7b90f9cee16cd214713edce62796b437",
    },
    CrosswordCore: {
      address: "0x05fa0ac5588385bdbf1c4e50f1dc0ce979a90519",
    },
    CrosswordPrizes: {
      address: "0xf2f327f2eef8b379ce897748bce2af37db63f6b1",
    },
    UserProfiles: {
      address: "0x513adc639d82d4f7c5ef007d156c39de59f05f7b",
    },
    ConfigManager: {
      address: "0xdf8994682c97e7add22cb026773a6874f8d78369",
    },
    AdminManager: {
      address: "0x8744d55f757600872a07e63abdf87c7b4ab223f8",
    },
    PublicCrosswordManager: {
      address: "0xfdd128cb3857bd0f204c998023ee9646fa1bd803",
    },
    BoardHistory: [
      "0xd262287e7b90f9cee16cd214713edce62796b437" // Current Sepolia contract
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
