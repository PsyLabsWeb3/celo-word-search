import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { defineChain } from 'viem';

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

export const useCeloNetwork = () => {
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const chainId = useChainId();

  const isOnCeloNetwork = chainId === celo.id || chainId === celoAlfajores.id || chainId === celoSepolia.id;
  const isOnCeloSepolia = chainId === celoSepolia.id;
  
  const ensureCeloNetwork = async () => {
    if (isConnected && !isOnCeloNetwork) {
      try {
        await switchChain({ chainId: celoSepolia.id });
        return { success: true, message: 'Switched to Celo Sepolia' };
      } catch (error) {
        return { success: false, message: 'Failed to switch to Celo network', error };
      }
    }
    return { success: true, message: 'Already on Celo network' };
  };

  return {
    isConnected,
    chainId,
    isOnCeloNetwork,
    isOnCeloSepolia,
    isOnMainnet: chainId === celo.id,
    isOnAlfajores: chainId === celoAlfajores.id,
    isOnSepolia: chainId === celoSepolia.id,
    ensureCeloNetwork,
    switchToCeloSepolia: () => switchChain({ chainId: celoSepolia.id }),
    switchToMainnet: () => switchChain({ chainId: celo.id }),
    switchToAlfajores: () => switchChain({ chainId: celoAlfajores.id }),
    isSwitching: isPending,
  };
};