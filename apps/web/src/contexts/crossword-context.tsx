import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGetCurrentCrossword, useIsAdmin } from '../hooks/useContract';
import { LOCAL_CONTRACTS } from '../lib/contracts';
import { useAccount } from 'wagmi';

interface CrosswordContextType {
  currentCrossword: {
    id: string;
    data: string;
    updatedAt: bigint;
  } | null;
  isLoading: boolean;
  isAdmin: boolean;
  refetchCrossword: () => void;
}

const CrosswordContext = createContext<CrosswordContextType | undefined>(undefined);

export const CrosswordProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const [currentCrossword, setCurrentCrossword] = useState<any>(null);
  
  const {
    data: crosswordData,
    isLoading,
    refetch: refetchCrosswordFromContract
  } = useGetCurrentCrossword();
  
  const { data: isAdminData } = useIsAdmin();

  // Update local state when contract data changes
  useEffect(() => {
    if (crosswordData && crosswordData.length >= 3) {
      setCurrentCrossword({
        id: crosswordData[0],
        data: crosswordData[1],
        updatedAt: crosswordData[2]
      });
    }
  }, [crosswordData]);

  const refetchCrossword = async () => {
    const result = await refetchCrosswordFromContract();
    if (result.data && result.data.length >= 3) {
      setCurrentCrossword({
        id: result.data[0],
        data: result.data[1],
        updatedAt: result.data[2]
      });
    }
  };

  // When wallet address changes, make sure to refetch admin status
  useEffect(() => {
    if (address) {
      // This will trigger the useIsAdmin hook to refetch
    }
  }, [address]);

  return (
    <CrosswordContext.Provider
      value={{
        currentCrossword,
        isLoading,
        isAdmin: !!isAdminData,
        refetchCrossword
      }}
    >
      {children}
    </CrosswordContext.Provider>
  );
};

export const useCrossword = () => {
  const context = useContext(CrosswordContext);
  if (context === undefined) {
    throw new Error('useCrossword must be used within a CrosswordProvider');
  }
  return context;
};