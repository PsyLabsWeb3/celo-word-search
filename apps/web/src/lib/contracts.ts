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
      address: "0x1d0742305f4873cea2f9daa36c3f05f572b494a4",
    },
    CrosswordCore: {
      address: "0x822035eee3ad4193b9bd63345b0c8781c4890046",
    },
    CrosswordPrizes: {
      address: "0xd9110b8eedc6a3a66e951de728fe5be6736a5fee",
    },
    UserProfiles: {
      address: "0xf3e8054549fd1417dee98431765ac5d2f561afae",
    },
    ConfigManager: {
      address: "0xe66816a1a31eb735834a97b8c081a04cf0904b97",
    },
    AdminManager: {
      address: "0x12ad671b61cd76fcb9108cfce5d206ebe7aeea6b",
    },
    PublicCrosswordManager: {
      address: "0x725f407188619451a969413f02427b63fa0ace1a",
    },
    BoardHistory: [
      "0x1d0742305f4873cea2f9daa36c3f05f572b494a4" // Current Sepolia contract
    ]
  }
};

// Local dev configuration
const LOCAL_CONTRACTS = {
  CrosswordBoard: {
    address: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // This would be from local hardhat
  }
};

export { CONTRACTS, LOCAL_CONTRACTS };
