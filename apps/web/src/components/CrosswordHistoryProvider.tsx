import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface CrosswordHistoryProviderProps {
  children: (props: {
    crosswords: CrosswordHistoryItem[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }) => React.ReactNode;
  crosswordIdsFilter?: `0x${string}`[];
}

const CrosswordHistoryProvider: React.FC<CrosswordHistoryProviderProps> = ({ 
  children, 
  crosswordIdsFilter 
}) => {
  const [crosswords, setCrosswords] = useState<CrosswordHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();
  const chainId = useChainId();
  const hasFetchedRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const contractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as `0x${string}` | undefined;

  const fetchCrosswords = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    if (!publicClient || !contractAddress || hasFetchedRef.current) {
      if (!publicClient || !contractAddress) {
        setIsLoading(false);
      }
      return Promise.resolve();
    }

    const fetchPromise = (async () => {
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


          if (completedCrosswords.length === 0) {
            console.log('No completed crosswords found, setting empty array');
            setCrosswords([]);
            setIsLoading(false);
            return;
          }

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
        } catch (err) {
          console.error('Error fetching completed crosswords:', err);
          // If fetching completed crosswords fails, set empty array instead of default
          setCrosswords([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching crossword history:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      } finally {
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [publicClient, contractAddress, chainId, crosswordIdsFilter]);

  // Execute fetch only once
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCrosswords();
    }
  }, [fetchCrosswords]);

  return (
    <>
      {children({
        crosswords,
        isLoading,
        isError,
        error
      })}
    </>
  );
};

export default React.memo(CrosswordHistoryProvider);