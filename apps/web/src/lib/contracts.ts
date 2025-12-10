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

// Contract configuration - addresses will be updated after deployment
const CONTRACTS = {
  [celo.id]: {
    CrosswordBoard: {
      address: "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648", // Mainnet deployment - Dec 2025
      currentCrosswordId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      // The ABI will be loaded dynamically to keep this file small
    }
  },
  [celoAlfajores.id]: {
    CrosswordBoard: {
      address: process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS || "0x0000000000000000000000000000000000000000",
      currentCrosswordId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      // The ABI will be loaded dynamically to keep this file small
    }
  },
  [celoSepolia.id]: {
    CrosswordBoard: {
      address: "0xED0F84f0ec54Bb0Bd6d59bf24AEbfec26bEa5c7C", // Updated deployment with security fixes
      currentCrosswordId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      // The ABI will be loaded dynamically to keep this file small
    }
  }
};

// Local dev configuration
const LOCAL_CONTRACTS = {
  CrosswordBoard: {
    address: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // This would be from local hardhat
    // The ABI will be loaded dynamically to keep this file small
  }
};

export { CONTRACTS, LOCAL_CONTRACTS };