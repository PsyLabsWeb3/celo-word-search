"use client";

import { useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
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

interface NetworkValidatorProps {
  children: React.ReactNode;
  enforceCelo?: boolean; // Whether to enforce Celo network
  redirectOnWrongNetwork?: boolean; // Whether to redirect when on wrong network
}

export function NetworkValidator({ 
  children, 
  enforceCelo = true,
  redirectOnWrongNetwork = false 
}: NetworkValidatorProps) {
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const chainId = useChainId();

  useEffect(() => {
    if (!enforceCelo) return;
    
    // Only switch to Celo network if the user is connected and not already on a Celo network
    if (isConnected && chainId !== celo.id && chainId !== celoAlfajores.id && chainId !== celoSepolia.id) {
      // Switch to Celo Sepolia automatically
      try {
        switchChain({ chainId: celoSepolia.id });
      } catch (error) {
        console.warn("Failed to switch to Celo Sepolia:", error);
      }
    }
  }, [isConnected, chainId, switchChain, enforceCelo]);

  // Show a message if user is connected but on the wrong network
  if (enforceCelo && isConnected && chainId !== celo.id && chainId !== celoAlfajores.id && chainId !== celoSepolia.id) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Network Not Supported</h2>
        <p className="mb-4">
          This application requires the Celo network. Please switch to Celo Sepolia Testnet.
        </p>
        <button
          onClick={() => switchChain({ chainId: celoSepolia.id })}
          disabled={isPending}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          {isPending ? 'Switching...' : 'Switch to Celo Sepolia'}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}