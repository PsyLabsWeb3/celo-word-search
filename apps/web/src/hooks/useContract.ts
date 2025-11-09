import { useContractRead, useContractWrite, useAccount, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '../lib/contracts';
import { celo, celoAlfajores } from 'wagmi/chains';
import { defineChain } from 'viem';
import { toast } from 'sonner';

// Define Celo Sepolia chain
const celoSepolia = defineChain({
  id: 44787, // Using the Alfajores testnet ID since that's likely what's being used
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'A-CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://alfajores.celoscan.io' },
  },
  testnet: true,
});

// Helper function to get contract config based on chain
const getContractConfig = (contractName: 'CrosswordBoard' | 'CrosswordPrizes') => {
  const chainId = useChainId();
  
  // Determine which chain configuration to use based on environment
  let chainConfig = CONTRACTS[celo.id]; // default to mainnet
  
  if (chainId === celo.id) {
    chainConfig = CONTRACTS[celo.id];
  } else if (chainId === celoAlfajores.id) {
    chainConfig = CONTRACTS[celoAlfajores.id];
  } else if (chainId === 11142220) { // Celo Sepolia testnet (new chain ID)
    chainConfig = CONTRACTS[11142220];
  } else if (chainId === 44787) { // Legacy testnet ID
    chainConfig = CONTRACTS[celoAlfajores.id];
  }
  
  const contract = chainConfig[contractName];
  
  return {
    address: contract.address as `0x${string}`,
    abi: contract.abi,
  };
};

// Helper function to get error message from error object
const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Check for common error properties
  if (error.shortMessage) return error.shortMessage;
  if (error.message) return error.message;
  if (error.reason) return error.reason;
  
  return 'Transaction failed. Please try again.';
};

// CrosswordBoard contract hooks
export const useGetCurrentCrossword = () => {
  const contractConfig = getContractConfig('CrosswordBoard');
  
  return useContractRead({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'getCurrentCrossword',
  });
};

export const useSetCrossword = () => {
  const { address, isConnected } = useAccount();
  const contractConfig = getContractConfig('CrosswordBoard');

  const { data, writeContract, error, isPending } = useContractWrite({
    onError: (error) => {
      toast.error('Error setting crossword', {
        description: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success('Crossword set successfully', {
        description: 'The crossword has been saved to the blockchain.',
      });
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
    onSuccess: () => {
      toast.success('Transaction confirmed', {
        description: 'Your crossword has been successfully saved on the blockchain.',
      });
    },
    onError: (error) => {
      toast.error('Transaction failed', {
        description: getErrorMessage(error),
      });
    }
  });

  return {
    setCrossword: (args: [`0x${string}`, string]) =>
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'setCrossword',
        args
      }),
    isLoading: isPending || isConfirming,
    isSuccess,
    isError: !!error,
    txHash: data,
  };
};

// Check if current account is admin
export const useIsAdmin = () => {
  const { address } = useAccount();
  const contractConfig = getContractConfig('CrosswordBoard');

  return useContractRead({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'isAdminAddress',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });
};

// CrosswordPrizes contract hooks
export const useGetCrosswordDetails = (crosswordId: `0x${string}`) => {
  const contractConfig = getContractConfig('CrosswordPrizes');
  
  return useContractRead({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'getCrosswordDetails',
    args: [crosswordId],
  });
};

export const useIsWinner = (crosswordId: `0x${string}`) => {
  const { address } = useAccount();
  const contractConfig = getContractConfig('CrosswordPrizes');

  return useContractRead({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'isWinner',
    args: address && crosswordId ? [crosswordId, address as `0x${string}`] : undefined,
    query: { enabled: !!address && !!crosswordId },
  });
};

export const useClaimPrize = () => {
  const contractConfig = getContractConfig('CrosswordPrizes');
  const { data, writeContract, error, isPending } = useContractWrite({
    onError: (error) => {
      toast.error('Error claiming prize', {
        description: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success('Prize claimed successfully', {
        description: 'Your prize has been claimed.',
      });
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
    onSuccess: () => {
      toast.success('Transaction confirmed', {
        description: 'Your prize has been successfully claimed.',
      });
    },
    onError: (error) => {
      toast.error('Transaction failed', {
        description: getErrorMessage(error),
      });
    }
  });

  return {
    claimPrize: (args: [`0x${string}`]) =>
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'claimPrize',
        args
      }),
    isLoading: isPending || isConfirming,
    isSuccess,
    isError: !!error,
    txHash: data,
  };
};

// Check if current account has admin role for CrosswordPrizes
export const useHasAdminRole = () => {
  const { address } = useAccount();
  const contractConfig = getContractConfig('CrosswordPrizes');

  // ADMIN_ROLE constant from the contract (this is typically keccak256("ADMIN_ROLE"))
  const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';

  return useContractRead({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'hasRole',
    args: address ? [ADMIN_ROLE, address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });
};

// Hook for creating crossword with prizes
export const useCreateCrossword = () => {
  const contractConfig = getContractConfig('CrosswordPrizes');
  const { data, writeContract, error, isPending } = useContractWrite({
    onError: (error) => {
      toast.error('Error creating crossword', {
        description: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success('Crossword created successfully', {
        description: 'The crossword with prizes has been created.',
      });
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
    onSuccess: () => {
      toast.success('Transaction confirmed', {
        description: 'The crossword has been successfully created on the blockchain.',
      });
    },
    onError: (error) => {
      toast.error('Transaction failed', {
        description: getErrorMessage(error),
      });
    }
  });

  return {
    createCrossword: (args: [`0x${string}`, `0x${string}`, bigint, number[], bigint]) =>
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'createCrossword',
        args
      }),
    isLoading: isPending || isConfirming,
    isSuccess,
    isError: !!error,
    txHash: data,
  };
};

// Hook for registering winners
export const useRegisterWinners = () => {
  const contractConfig = getContractConfig('CrosswordPrizes');
  const { data, writeContract, error, isPending } = useContractWrite({
    onError: (error) => {
      toast.error('Error registering winners', {
        description: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success('Winners registered successfully', {
        description: 'The winners have been registered for the crossword.',
      });
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
    onSuccess: () => {
      toast.success('Transaction confirmed', {
        description: 'The winners have been successfully registered on the blockchain.',
      });
    },
    onError: (error) => {
      toast.error('Transaction failed', {
        description: getErrorMessage(error),
      });
    }
  });

  return {
    registerWinners: (args: [`0x${string}`, `0x${string}`[]]) =>
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'registerWinners',
        args
      }),
    isLoading: isPending || isConfirming,
    isSuccess,
    isError: !!error,
    txHash: data,
  };
};