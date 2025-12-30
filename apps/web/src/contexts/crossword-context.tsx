import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useGetCurrentCrossword, useIsAdmin, useGetActivePublicCrosswords, useGetPublicCrosswordDetails } from '../hooks/useContract';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

interface Crossword {
  id: string;
  data: string;
  updatedAt: bigint;
  isPublic?: boolean;
  sponsoredBy?: string;
}

interface CrosswordContextType {
  currentCrossword: Crossword | null;
  activeCrosswords: string[];
  isLoading: boolean;
  isAdmin: boolean;
  refetchCrossword: () => void;
  setActiveCrossword: (crosswordId: string, crosswordData: string, sponsoredBy?: string) => void;
}

const CrosswordContext = createContext<CrosswordContextType | undefined>(undefined);

export const CrosswordProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [currentCrossword, setCurrentCrossword] = useState<Crossword | null>(null);
  const [activeCrosswords, setActiveCrosswords] = useState<string[]>([]);
  const [isManualSelection, setIsManualSelection] = useState(false);

  const {
    data: crosswordData,
    isLoading: isCurrentCrosswordLoading,
    isError: isCurrentCrosswordError,
    error: currentCrosswordError,
    refetch: refetchCrosswordFromContract
  } = useGetCurrentCrossword();

  const {
    data: activeCrosswordsData,
    isLoading: isActiveCrosswordsLoading,
    isError: isActiveCrosswordsError,
    error: activeCrosswordsError,
    refetch: refetchActiveCrosswords
  } = useGetActivePublicCrosswords();

  const { data: isAdminData } = useIsAdmin();
  
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlId = queryParams?.get('id');
  const urlIsPublic = queryParams?.get('isPublic') === 'true';

  // Update current crossword when contract data changes
  useEffect(() => {
    // If we have URL parameters, initialize with those
    if (urlId && urlIsPublic && !isManualSelection) {
      setIsManualSelection(true);
      // We don't have the data yet, but setting the ID will help
      // The component using this context will likely trigger a fetch
      // or we can fetch it here if needed.
      return;
    }

    // Only update from contract if we haven't manually selected a crossword
    if (isManualSelection) return;

    if (crosswordData && Array.isArray(crosswordData) && crosswordData.length >= 3) {
      const [id, data, updatedAt] = crosswordData as [string, string, bigint];
      // Verificar si los datos son válidos (no vacíos)
      if (id && data && updatedAt) {
        setCurrentCrossword({
          id,
          data,
          updatedAt,
          isPublic: false
        });
      } else {
        setCurrentCrossword(null);
      }
    } else if (crosswordData === null) {
      // Si no hay datos, asegurarse de que se limpie el estado
      setCurrentCrossword(null);
    }
  }, [crosswordData, isManualSelection, urlId, urlIsPublic]);

  // Fetch details for manual selection if missing data (e.g. on reload)
  const { data: manualCrosswordDetails } = useGetPublicCrosswordDetails(
    (urlId && isManualSelection && !currentCrossword?.data) ? urlId as `0x${string}` : undefined as any
  );

  useEffect(() => {
    if (manualCrosswordDetails && !currentCrossword?.data && urlId && isManualSelection) {
      const d = manualCrosswordDetails as any;
      const data = d[2]; // crosswordData is at index 2
      const sponsoredBy = d[1]; // sponsoredBy is at index 1
      const createdAt = d[9]; // createdAt is at index 9
      
      if (data) {
        setCurrentCrossword({
          id: urlId,
          data: data,
          updatedAt: BigInt(createdAt || 0),
          isPublic: true,
          sponsoredBy: sponsoredBy
        });
      }
    }
  }, [manualCrosswordDetails, currentCrossword, urlId, isManualSelection]);

  // Update active crosswords when contract data changes
  useEffect(() => {
    if (activeCrosswordsData && Array.isArray(activeCrosswordsData)) {
      setActiveCrosswords(activeCrosswordsData);
    }
  }, [activeCrosswordsData]);

  // Log any errors for debugging
  useEffect(() => {
    if (isCurrentCrosswordError && currentCrosswordError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching current crossword from contract:", currentCrosswordError);
      }
    } else if (isCurrentCrosswordError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching current crossword from contract without specific error details");
      }
    }

    if (isActiveCrosswordsError && activeCrosswordsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching active crosswords from contract:", activeCrosswordsError);
      }
    } else if (isActiveCrosswordsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching active crosswords from contract without specific error details");
      }
    }
  }, [isCurrentCrosswordError, currentCrosswordError, isActiveCrosswordsError, activeCrosswordsError]);

  const refetchCrossword = async () => {
    // When manually refetching, we want to reset the manual selection
    setIsManualSelection(false);
    
    // Refetch current crossword
    const result = await refetchCrosswordFromContract();
    if (result.data && Array.isArray(result.data) && result.data.length >= 3) {
      const [id, data, updatedAt] = result.data as [string, string, bigint];
      // Verificar si los datos son válidos (no vacíos)
      if (id && data && updatedAt) {
        setCurrentCrossword({
          id,
          data,
          updatedAt,
          isPublic: false
        });
      } else {
        setCurrentCrossword(null);
      }
    } else {
      // Si no hay datos válidos, limpiar el estado
      setCurrentCrossword(null);
    }

    // Also refetch active crosswords
    await refetchActiveCrosswords();
  };

  // Function to set a specific crossword as the active one
  const setActiveCrossword = (crosswordId: string, crosswordData: string, sponsoredBy?: string) => {
    setIsManualSelection(true);
    setCurrentCrossword({
      id: crosswordId,
      data: crosswordData,
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      isPublic: true,
      sponsoredBy: sponsoredBy
    });
  };

  // When wallet address changes, make sure to refetch admin status
  useEffect(() => {
    if (address) {
      // This will trigger the useIsAdmin hook to refetch
    }
  }, [address]);

  const isLoading = isCurrentCrosswordLoading || isActiveCrosswordsLoading;

  return (
    <CrosswordContext.Provider
      value={{
        currentCrossword,
        activeCrosswords,
        isLoading,
        isAdmin: !!isAdminData,
        refetchCrossword,
        setActiveCrossword
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