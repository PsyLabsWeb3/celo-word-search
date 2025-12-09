import { useState, useEffect, useRef, useMemo } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { getHistoricalCrosswordData } from '@/lib/historical-crosswords';

interface CrosswordHistoryItem {
  crosswordId: `0x${string}`;
  token: string;
  prizePool: bigint;
  creator: string;
  blockNumber: bigint;
  timestamp?: number;
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

  // Get contract address for current chain
  const contractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as `0x${string}` | undefined;

  // Refs to prevent unnecessary re-execution
  const prevChainId = useRef(chainId);
  const prevContractAddress = useRef(contractAddress);
  const prevCrosswordIdsFilter = useRef(crosswordIdsFilter);
  
  // Check if dependencies have actually changed
  const hasChanged = useRef(false);
  if (
    prevChainId.current !== chainId ||
    prevContractAddress.current !== contractAddress ||
    JSON.stringify(prevCrosswordIdsFilter.current) !== JSON.stringify(crosswordIdsFilter)
  ) {
    hasChanged.current = true;
    prevChainId.current = chainId;
    prevContractAddress.current = contractAddress;
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
      if (!publicClient || !contractAddress) {
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
                  timestamp: historicalData.timestamp || 0
                };
              }

              // Otherwise fetch details from contract
              const details = await publicClient.readContract({
                address: contractAddress,
                abi: [{
                  "inputs": [{ "internalType": "bytes32", "name": "crosswordId", "type": "bytes32" }],
                  "name": "getCrosswordDetails",
                  "outputs": [
                    { "internalType": "address", "name": "token", "type": "address" },
                    { "internalType": "uint256", "name": "totalPrizePool", "type": "uint256" },
                    { "internalType": "uint256[]", "name": "winnerPercentages", "type": "uint256[]" },
                    { "internalType": "tuple[]", "name": "completions", "type": "tuple[]", "components": [
                      { "internalType": "address", "name": "user", "type": "address" },
                      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                      { "internalType": "uint256", "name": "rank", "type": "uint256" }
                    ]},
                    { "internalType": "uint256", "name": "activationTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "endTime", "type": "uint256" },
                    { "internalType": "enum CrosswordBoard.CrosswordState", "name": "state", "type": "uint8" }
                  ],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'getCrosswordDetails',
                args: [id]
              }) as [string, bigint, bigint[], any[], bigint, bigint, number];

              const [token, prizePool, , , activationTime] = details;

              return {
                crosswordId: id,
                token: token,
                prizePool: prizePool,
                creator: '0x0000000000000000000000000000000000000000', // Creator not stored in details, but not critical
                blockNumber: 0n, // Not needed for display
                timestamp: Number(activationTime)
              };
            } catch (err) {
              console.error(`Error fetching details for crossword ${id}:`, err);
              // Fallback to basic info if fetch fails
              return {
                crosswordId: id,
                token: '0x0000000000000000000000000000000000000000',
                prizePool: 0n,
                creator: '0x0000000000000000000000000000000000000000',
                blockNumber: 0n,
                timestamp: Date.now() / 1000
              };
            }
          });

          const crosswords = await Promise.all(crosswordPromises);
          setCrosswords(crosswords);
          setIsLoading(false);
          return;
        }

        // Otherwise, fetch the completed crosswords from the contract
        try {
          console.log('Fetching completed crosswords from contract...');
          const completedCrosswords = await publicClient.readContract({
            address: contractAddress,
            abi: [{
              "inputs": [],
              "name": "getCompletedCrosswords",
              "outputs": [
                { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
              ],
              "stateMutability": "view",
              "type": "function"
            }],
            functionName: 'getCompletedCrosswords'
          }) as `0x${string}`[];

          console.log('Completed crosswords from contract:', completedCrosswords);

          const crosswordPromises = completedCrosswords.map(async (id) => {
            try {
              // For completed crosswords, fetch details from contract
              const details = await publicClient.readContract({
                address: contractAddress,
                abi: [{
                  "inputs": [{ "internalType": "bytes32", "name": "crosswordId", "type": "bytes32" }],
                  "name": "getCrosswordDetails",
                  "outputs": [
                    { "internalType": "address", "name": "token", "type": "address" },
                    { "internalType": "uint256", "name": "totalPrizePool", "type": "uint256" },
                    { "internalType": "uint256[]", "name": "winnerPercentages", "type": "uint256[]" },
                    { "internalType": "tuple[]", "name": "completions", "type": "tuple[]", "components": [
                      { "internalType": "address", "name": "user", "type": "address" },
                      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                      { "internalType": "uint256", "name": "rank", "type": "uint256" }
                    ]},
                    { "internalType": "uint256", "name": "activationTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "endTime", "type": "uint256" },
                    { "internalType": "enum CrosswordBoard.CrosswordState", "name": "state", "type": "uint8" },
                    { "internalType": "string", "name": "name", "type": "string" },
                    { "internalType": "string", "name": "gridData", "type": "string" }
                  ],
                  "stateMutability": "view",
                  "type": "function"
                }],
                functionName: 'getCrosswordDetails',
                args: [id]
              }) as [string, bigint, bigint[], any[], bigint, bigint, number, string, string];

              const [token, prizePool, , , activationTime] = details;

              return {
                crosswordId: id,
                token: token,
                prizePool: prizePool,
                creator: '0x0000000000000000000000000000000000000000', // Creator not stored in details, but not critical
                blockNumber: 0n, // Not needed for display
                timestamp: Number(activationTime)
              };
            } catch (err) {
              console.error(`Error fetching details for completed crossword ${id}:`, err);
              // Fallback to basic info if fetch fails
              return {
                crosswordId: id,
                token: '0x0000000000000000000000000000000000000000',
                prizePool: 0n,
                creator: '0x0000000000000000000000000000000000000000',
                blockNumber: 0n,
                timestamp: Date.now() / 1000
              };
            }
          });

          const crosswords = await Promise.all(crosswordPromises);
          setCrosswords(crosswords);
          console.log('Completed crosswords loaded:', crosswords);
        } catch (err) {
          console.error('Error fetching completed crosswords:', err);
          // If fetching completed crosswords fails, fall back to old behavior
          const currentCrosswordId = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.currentCrosswordId as `0x${string}` | undefined;

          const crosswords: CrosswordHistoryItem[] = [];

          if (currentCrosswordId) {
            crosswords.push({
              crosswordId: currentCrosswordId,
              token: '0x0000000000000000000000000000000000000000',
              prizePool: 0n,
              creator: '0x0000000000000000000000000000000000000000',
              blockNumber: 999999999999n,
              timestamp: Date.now() / 1000
            });
          }

          setCrosswords(crosswords);
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
  }, [publicClient, contractAddress, chainId, crosswordIdsFilter, isLoading]);

  return {
    crosswords,
    isLoading,
    isError,
    error,
    hasMore: false, // No pagination needed
    loadMore: () => {}, // No-op
  };
}