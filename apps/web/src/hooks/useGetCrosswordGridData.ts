import { useState, useEffect } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { getHistoricalCrosswordData } from '@/lib/historical-crosswords';

interface CrosswordGridData {
  clues: any[];
  gridSize: { rows: number; cols: number };
}

export function useGetCrosswordGridData(crosswordId: `0x${string}` | undefined) {
  const [gridData, setGridData] = useState<CrosswordGridData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const publicClient = usePublicClient();
  const chainId = useChainId();

  useEffect(() => {
    if (!crosswordId || !publicClient) {
      setGridData(null);
      setIsLoading(false);
      return;
    }

    const fetchGridData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const contractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as `0x${string}` | undefined;
        
        if (!contractAddress) {
          throw new Error('Contract address not found');
        }

        // First, check if this is a known historical crossword
        const historicalData = getHistoricalCrosswordData(crosswordId);
        if (historicalData && historicalData.clues && historicalData.gridSize) {
          console.log(`Loading historical crossword data for ${crosswordId}`);
          setGridData({
            clues: historicalData.clues,
            gridSize: historicalData.gridSize
          });
          setIsLoading(false);
          return;
        }

        // Otherwise, fetch details from the contract
        try {
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
            args: [crosswordId]
          }) as [string, bigint, bigint[], any[], bigint, bigint, number, string, string];

          const gridDataStr = details[8];

          if (gridDataStr) {
            try {
              const parsedGridData = JSON.parse(gridDataStr);
              setGridData({
                clues: parsedGridData.clues,
                gridSize: parsedGridData.gridSize
              });
            } catch (e) {
              console.error(`Error parsing grid data for crossword ${crosswordId}:`, e);
              setError(new Error('Invalid grid data format'));
              setGridData(null);
            }
          } else {
            setGridData(null);
          }
        } catch (err) {
          console.error(`Failed to fetch crossword details for ${crosswordId}:`, err);
          setError(err instanceof Error ? err : new Error('Unknown error fetching details'));
          setGridData(null);
        }
      } catch (err) {
        console.error('Error in crossword grid data fetch:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setGridData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGridData();
  }, [crosswordId, publicClient, chainId]);

  return { gridData, isLoading, error };
}
