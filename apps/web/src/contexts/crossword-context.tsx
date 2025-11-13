import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGetCurrentCrossword, useIsAdmin } from '../hooks/useContract';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [currentCrossword, setCurrentCrossword] = useState<any>(null);
  
  const {
    data: crosswordData,
    isLoading,
    isError,
    error,
    refetch: refetchCrosswordFromContract
  } = useGetCurrentCrossword();
  
  const { data: isAdminData } = useIsAdmin();

  // Update local state when contract data changes
  useEffect(() => {
    if (crosswordData && Array.isArray(crosswordData) && crosswordData.length >= 3) {
      const [id, data, updatedAt] = crosswordData as [string, string, bigint];
      // Verificar si los datos son válidos (no vacíos)
      if (id && data && updatedAt) {

        setCurrentCrossword({
          id,
          data,
          updatedAt
        });
      } else {

        setCurrentCrossword(null);
      }
    } else if (crosswordData === null) {
      // Si no hay datos, asegurarse de que se limpie el estado

      setCurrentCrossword(null);
    }
  }, [crosswordData]);

  // Log any errors for debugging
  useEffect(() => {
    if (isError && error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching crossword from contract:", error);
      }
    } else if (isError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching crossword from contract without specific error details");
      }
    }
  }, [isError, error]);

  // Debug logs para entender el estado de carga
  useEffect(() => {

  }, [isLoading, isError, crosswordData, error]);

  const refetchCrossword = async () => {
    // Just refetch from blockchain directly without manual cache invalidation
    // The refetchCrosswordFromContract function should handle refetching from blockchain
    const result = await refetchCrosswordFromContract();
    if (result.data && Array.isArray(result.data) && result.data.length >= 3) {
      const [id, data, updatedAt] = result.data as [string, string, bigint];
      setCurrentCrossword({
        id,
        data,
        updatedAt
      });
    } else {
      // Si no hay datos válidos, limpiar el estado
      setCurrentCrossword(null);
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