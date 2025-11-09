"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

// Define Celo Sepolia chain based on the RPC URL provided
const celoSepolia = defineChain({
  id: 11142220, // Celo Sepolia Testnet chain ID
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

// Verificar si estamos en un entorno compatible con Farcaster
// Detectar si estamos en un entorno de Farcaster
const isFarcasterFrame = typeof window !== 'undefined' && 
  (window as any).frameContext !== undefined;

// Detectar si estamos en modo desarrollo
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   process.env.NODE_ENV === 'development');

// Crear conectores dependiendo del entorno
const getConnectors = () => {
  if (isFarcasterFrame) {
    // En entorno de Farcaster: usar conector específico
    return [farcasterMiniApp()];
  } else {
    // En desarrollo o en entornos no Farcaster: permitir wallets externas como MetaMask
    return [
      injected({
        // Opciones para manejar mejor el conflicto con otras extensiones
        shimDisconnect: true,
      }),
      farcasterMiniApp() // Incluir también el conector de Farcaster como opción
    ];
  }
};

const connectors = getConnectors(); // Usar MetaMask como fallback

const config = createConfig({
  chains: [celo, celoAlfajores, celoSepolia],
  connectors: getConnectors(),
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [celoSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
