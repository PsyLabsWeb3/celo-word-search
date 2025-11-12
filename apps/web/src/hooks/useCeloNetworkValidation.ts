import { useAccount, useChainId } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { defineChain } from "viem";

// Define Celo Sepolia chain
const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'A-CELO', decimals: 18 },
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

export const useCeloNetworkValidation = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Check if the current chain is either Celo mainnet or Celo testnets (Alfajores or Sepolia)
  const isOnCeloNetwork = isConnected && 
    (chainId === celo.id || chainId === celoAlfajores.id || chainId === celoSepolia.id || chainId === 44787); // 44787 is legacy Alfajores ID

  // Get the chain name for display purposes
  const getChainName = () => {
    if (chainId === celo.id) return 'Celo Mainnet';
    if (chainId === celoAlfajores.id || chainId === 44787) return 'Celo Alfajores Testnet';
    if (chainId === celoSepolia.id) return 'Celo Sepolia Testnet';
    return 'an unsupported network';
  };

  const currentChainName = getChainName();

  return {
    isOnCeloNetwork,
    isConnected,
    currentChainId: chainId,
    currentChainName,
    celoChainIds: [celo.id, celoAlfajores.id, celoSepolia.id, 44787],
    requiredNetworks: ['Celo Mainnet', 'Celo Alfajores Testnet', 'Celo Sepolia Testnet']
  };
};