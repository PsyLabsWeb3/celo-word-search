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
      address: "0xdf57dbd62dbbc4187536ebdd4555df07ae3b68b0",
    },
    CrosswordCore: {
      address: "0x26a749edcf8d44a4322e964b3bed619236425af7",
    },
    CrosswordPrizes: {
      address: "0xa17fe3bcb6e126e55ce7d1573191dba62b9c408e",
    },
    UserProfiles: {
      address: "0x2712396e8c09f0a0a506773523f31b354322e650",
    },
    ConfigManager: {
      address: "0x0cee101c98be2e855232e2cafc7c8f97108fa52e",
    },
    AdminManager: {
      address: "0x86c634260bdc44a0357b674c6ce6d9e42af2b93c",
    },
    PublicCrosswordManager: {
      address: "0x67d0f17bff5286e408871f7a61ba616715036166",
    },
    BoardHistory: [
      "0xdf57dbd62dbbc4187536ebdd4555df07ae3b68b0" // Current Sepolia contract
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
