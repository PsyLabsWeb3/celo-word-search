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
      address: process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS || "0x0000000000000000000000000000000000000000",
      // The ABI will be loaded dynamically to keep this file small
    }
  },
  [celoAlfajores.id]: {
    CrosswordBoard: {
      address: process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS || "0x0000000000000000000000000000000000000000",
      // The ABI will be loaded dynamically to keep this file small
    }
  },
  [celoSepolia.id]: {
    CrosswordBoard: {
      address: "0x0c7cf17265a6b1330119584c23b9c1b12a8550ab", // Deployed unified contract with claim fixes
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