import { useState, useEffect, useRef, useMemo } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { getHistoricalCrosswordData, HISTORICAL_CROSSWORDS } from '@/lib/historical-crosswords';

interface CrosswordHistoryItem {
  crosswordId: `0x${string}`;
  token: string;
  prizePool: bigint;
  creator: string;
  blockNumber: bigint;
  timestamp: number;
  contractAddress: `0x${string}`;
  coreAddress?: `0x${string}`; // Separate core address for completions on modularized contracts
  isLegacy?: boolean; // New property
  name?: string;
  sponsoredBy?: string;
  gridData?: { clues: any[]; gridSize: { rows: number; cols: number }; isTest?: boolean };
}

interface UseGetCrosswordHistoryReturn {
  crosswords: CrosswordHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function useGetCrosswordHistory(
  options?: {
    crosswordIds?: `0x${string}`[]; // Optional: filter by specific crossword IDs
  }
): UseGetCrosswordHistoryReturn {
  const crosswordIdsFilter = useMemo(() => options?.crosswordIds || [], [options?.crosswordIds]);
  const [crosswords, setCrosswords] = useState<CrosswordHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Get board history for current chain
  const boardHistory = (CONTRACTS as any)[chainId]?.['BoardHistory'] as `0x${string}`[] || [];
  const currentContractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as `0x${string}` | undefined;
  
  // Use either the history list or the current address if history is empty
  const contractAddresses = useMemo(() => 
    boardHistory.length > 0 ? boardHistory : (currentContractAddress ? [currentContractAddress] : []),
    [boardHistory, currentContractAddress]
  );

  // Refs to prevent unnecessary re-execution
  const prevChainId = useRef(chainId);
  const prevContractAddresses = useRef(contractAddresses);
  const prevCrosswordIdsFilter = useRef(crosswordIdsFilter);
  
  // Check if dependencies have actually changed
  const hasChanged = useRef(false);
  if (
    prevChainId.current !== chainId ||
    JSON.stringify(prevContractAddresses.current) !== JSON.stringify(contractAddresses) ||
    JSON.stringify(prevCrosswordIdsFilter.current) !== JSON.stringify(crosswordIdsFilter)
  ) {
    hasChanged.current = true;
    prevChainId.current = chainId;
    prevContractAddresses.current = contractAddresses;
    prevCrosswordIdsFilter.current = crosswordIdsFilter;
  }

  // Fetch all crossword events at once
  useEffect(() => {
    // Skip if nothing has changed and we've already loaded data
    if (!hasChanged.current && !isLoading) {
      return;
    }
    
    hasChanged.current = false;
    
    const fetchCrosswords = async () => {
      if (!publicClient || contractAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);

        // If specific crossword IDs are provided, fetch details for each
        if (crosswordIdsFilter && crosswordIdsFilter.length > 0) {
          const crosswordPromises = crosswordIdsFilter.map(async (id) => {
            try {
              // First check if this is a historical crossword with hardcoded data
              const historicalData = getHistoricalCrosswordData(id);

              if (historicalData) {
                // Use hardcoded data from historical-crosswords.ts
                return {
                  crosswordId: id,
                  token: historicalData.token || '0x0000000000000000000000000000000000000000',
                  prizePool: BigInt(historicalData.prizePool || '0'),
                  creator: '0x0000000000000000000000000000000000000000',
                  blockNumber: 0n,
                  timestamp: historicalData.timestamp || 0,
                  contractAddress: (historicalData as any).contractAddress || contractAddresses[0],
                  coreAddress: (historicalData as any).coreAddress || (historicalData as any).contractAddress,
                  isLegacy: true,
                  name: historicalData.name,
                  gridData: historicalData.gridSize && historicalData.clues ? {
                    clues: historicalData.clues,
                    gridSize: historicalData.gridSize
                  } : undefined
                } as CrosswordHistoryItem;
              }

              // Otherwise fetch details from the first contract that has this crossword
              for (const address of contractAddresses) {
                try {
                  const details = await publicClient.readContract({
                    address: address,
                    abi: [{
                      "inputs": [{ "internalType": "bytes32", "name": "crosswordId", "type": "bytes32" }],
                      "name": "getCrosswordDetails",
                      "outputs": [
                        { "internalType": "address", "name": "token", "type": "address" },
                        { "internalType": "uint256", "name": "totalPrizePool", "type": "uint256" },
                        { "internalType": "uint256[]", "name": "winnerPercentages", "type": "uint256[]" },
                        { "internalType": "tuple[]", "name": "completions", "type": "tuple[]", "components": [
                          { "internalType": "address", "name": "user", "type": "address" },
                          { "internalType": "uint256", "name": "completionTimestamp", "type": "uint256" },
                          { "internalType": "uint256", "name": "durationMs", "type": "uint256" }
                        ]},
                        { "internalType": "uint256", "name": "activationTime", "type": "uint256" },
                        { "internalType": "uint256", "name": "endTime", "type": "uint256" },
                        { "internalType": "uint8", "name": "state", "type": "uint8" },
                        { "internalType": "string", "name": "name", "type": "string" },
                        { "internalType": "string", "name": "gridData", "type": "string" },
                        { "internalType": "string", "name": "sponsoredBy", "type": "string" }
                      ],
                      "stateMutability": "view",
                      "type": "function"
                    }],
                    functionName: 'getCrosswordDetails',
                    args: [id]
                  }) as any;

                  const [token, prizePool, , , activationTime, , , name, gridDataStr, sponsoredBy] = details as [string, bigint, any[], any[], bigint, bigint, number, string, string, string];

                  // If details found, parsing grid data
                  let gridData;
                  if (gridDataStr) {
                    try {
                      const parsedGridData = JSON.parse(gridDataStr);
                      gridData = {
                        clues: parsedGridData.clues,
                        gridSize: parsedGridData.gridSize,
                        isTest: parsedGridData.isTest
                      };
                    } catch (e) {
                      gridData = undefined;
                    }
                  }

                    return {
                      crosswordId: id,
                      token: token,
                      prizePool: prizePool,
                      creator: '0x0000000000000000000000000000000000000000',
                      blockNumber: 0n,
                      timestamp: Number(activationTime),
                      contractAddress: address,
                      coreAddress: (CONTRACTS as any)[chainId]?.['CrosswordCore']?.address as `0x${string}` | undefined,
                      name: name || undefined,
                      sponsoredBy: sponsoredBy || undefined,
                      gridData
                    } as CrosswordHistoryItem;
                } catch (contractErr) {
                  // If fetch fails from one contract, try next one in history
                  continue;
                }
              }

              // Fallback if not found in any contract
              return {
                crosswordId: id,
                token: '0x0000000000000000000000000000000000000000',
                prizePool: 0n,
                creator: '0x0000000000000000000000000000000000000000',
                blockNumber: 0n,
                timestamp: Math.floor(Date.now() / 1000),
                contractAddress: contractAddresses[0],
                name: undefined,
                gridData: undefined
              } as CrosswordHistoryItem;
            } catch (err) {
              console.error(`Error fetching details for crossword ${id}:`, err);
              return null;
            }
          });

          const results = (await Promise.all(crosswordPromises)).filter((c): c is CrosswordHistoryItem => c !== null);
          results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setCrosswords(results);
          setIsLoading(false);
          return;
        }

        // Otherwise, fetch all completed crosswords from all configured contracts
        try {
          console.log(`Fetching completed crosswords from ${contractAddresses.length} contracts...`);
          
          const allCompletedIdsPromises = contractAddresses.map(async (address) => {
            try {
              // Try getCompletedCrosswords (Legacy)
              try {
                return await publicClient.readContract({
                  address,
                  abi: [{
                    "inputs": [],
                    "name": "getCompletedCrosswords",
                    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
                    "stateMutability": "view",
                    "type": "function"
                  }],
                  functionName: 'getCompletedCrosswords'
                }) as `0x${string}`[];
              } catch (e) {
                // If fails, try getAllPublicCrosswords (Modern)
                return await publicClient.readContract({
                  address,
                  abi: [{
                    "inputs": [],
                    "name": "getAllPublicCrosswords",
                    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
                    "stateMutability": "view",
                    "type": "function"
                  }],
                  functionName: 'getAllPublicCrosswords'
                }) as `0x${string}`[];
              }
            } catch (err) {
              console.warn(`Could not fetch crosswords from ${address}:`, err);
              return [];
            }
          });

          const completedIdSets = await Promise.all(allCompletedIdsPromises);
          // Deduplicate IDs in case they exist across contracts (unlikely but possible)
           const legacyIds = Object.keys(HISTORICAL_CROSSWORDS) as `0x${string}`[];
           const combinedIds = Array.from(new Set([...completedIdSets.flat(), ...legacyIds]));
           const uniqueCompletedIds = combinedIds;

          const crosswordPromises = uniqueCompletedIds.map(async (id) => {
            // First check if this is a historical crossword with hardcoded data
            const historicalData = getHistoricalCrosswordData(id);

            if (historicalData) {
              return {
                crosswordId: id,
                token: historicalData.token || '0x0000000000000000000000000000000000000000',
                prizePool: BigInt(historicalData.prizePool || '0'),
                creator: '0x0000000000000000000000000000000000000000',
                blockNumber: 0n,
                timestamp: historicalData.timestamp || 0,
                contractAddress: (historicalData as any).contractAddress || contractAddresses[0],
                coreAddress: (historicalData as any).coreAddress || (historicalData as any).contractAddress,
                isLegacy: true,
                name: historicalData.name,
                sponsoredBy: historicalData.sponsoredBy,
                gridData: historicalData.gridSize && historicalData.clues ? {
                  clues: historicalData.clues,
                  gridSize: historicalData.gridSize
                } : undefined
              } as CrosswordHistoryItem;
            }

            // Find details for each ID
            for (const address of contractAddresses) {
              try {
                const details = await publicClient.readContract({
                  address,
                  abi: [{
                    "inputs": [{ "internalType": "bytes32", "name": "crosswordId", "type": "bytes32" }],
                    "name": "getCrosswordDetails",
                    "outputs": [
                      { "internalType": "address", "name": "token", "type": "address" },
                      { "internalType": "uint256", "name": "totalPrizePool", "type": "uint256" },
                      { "internalType": "uint256[]", "name": "winnerPercentages", "type": "uint256[]" },
                      { "internalType": "tuple[]", "name": "completions", "type": "tuple[]", "components": [
                        { "internalType": "address", "name": "user", "type": "address" },
                        { "internalType": "uint256", "name": "completionTimestamp", "type": "uint256" },
                        { "internalType": "uint256", "name": "durationMs", "type": "uint256" }
                      ]},
                      { "internalType": "uint256", "name": "activationTime", "type": "uint256" },
                      { "internalType": "uint256", "name": "endTime", "type": "uint256" },
                      { "internalType": "uint8", "name": "state", "type": "uint8" },
                      { "internalType": "string", "name": "name", "type": "string" },
                      { "internalType": "string", "name": "gridData", "type": "string" },
                      { "internalType": "string", "name": "sponsoredBy", "type": "string" }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  }],
                  functionName: 'getCrosswordDetails',
                  args: [id]
                }) as any;

                const [token, prizePool, , , activationTime, , , name, gridDataStr, sponsoredBy] = details as [string, bigint, any[], any[], bigint, bigint, number, string, string, string];

                let gridData;
                if (gridDataStr) {
                  try {
                    const parsedGridData = JSON.parse(gridDataStr);
                    gridData = {
                      clues: parsedGridData.clues,
                      gridSize: parsedGridData.gridSize,
                      isTest: parsedGridData.isTest
                    };
                  } catch (e) {
                    gridData = undefined;
                  }
                }

                const isLegacy = !!getHistoricalCrosswordData(id);

                return {
                  crosswordId: id,
                  token,
                  prizePool,
                  creator: '0x0000000000000000000000000000000000000000',
                  blockNumber: 0n,
                  timestamp: Number(activationTime),
                  contractAddress: address,
                  coreAddress: (CONTRACTS as any)[chainId]?.['CrosswordCore']?.address as `0x${string}` | undefined,
                  isLegacy,
                  name: name || undefined,
                  sponsoredBy: sponsoredBy || undefined,
                  gridData
                } as CrosswordHistoryItem;
              } catch (e) {
                continue;
              }
            }
            return null;
          });

          const results = (await Promise.all(crosswordPromises)).filter((c): c is CrosswordHistoryItem => c !== null);
          results.sort((a, b) => b.timestamp - a.timestamp);
          setCrosswords(results);
        } catch (err) {
          console.error('Error fetching completed crosswords:', err);
          setCrosswords([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching crossword history:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };

    fetchCrosswords();
  }, [publicClient, chainId, contractAddresses, crosswordIdsFilter, isLoading]);

  return {
    crosswords,
    isLoading,
    isError,
    error,
    hasMore: false,
    loadMore: () => {},
  };
}