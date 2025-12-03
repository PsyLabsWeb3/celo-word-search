import { useState, useEffect } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { parseAbiItem } from 'viem';

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
    if (!crosswordId || !publicClient) return;

    const fetchGridData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const contractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as `0x${string}` | undefined;
        const currentCrosswordId = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.currentCrosswordId as `0x${string}` | undefined;
        
        if (!contractAddress) {
          throw new Error('Contract address not found');
        }

        // If this is the current crossword, try to get data directly from contract
        if (crosswordId === currentCrosswordId) {
          try {
            const data = await publicClient.readContract({
              address: contractAddress,
              abi: [{
                "inputs": [],
                "name": "currentCrosswordData",
                "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
              }],
              functionName: 'currentCrosswordData'
            }) as string;

            if (data) {
              try {
                const parsedData = JSON.parse(data);
                setGridData({
                  clues: parsedData.clues,
                  gridSize: parsedData.gridSize
                });
                setIsLoading(false);
                return; // Success! Exit early
              } catch (e) {
                console.error('Error parsing current crossword data JSON:', e);
                // Fall through to event-based approach
              }
            }
          } catch (err) {
            console.warn('Failed to fetch current crossword data, trying events:', err);
            // Fall through to event-based approach
          }
        }

        // Fetch CrosswordUpdated events for this ID
        // For historical crosswords, use a larger block range (100k blocks)
        const currentBlock = await publicClient.getBlockNumber();
        const blockRange = 100000n; // Increased from 10k to 100k
        const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;
        
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event CrosswordUpdated(bytes32 indexed crosswordId, string crosswordData, address updatedBy)'),
          args: {
            crosswordId: crosswordId
          },
          fromBlock: fromBlock, 
          toBlock: 'latest'
        });

        if (logs.length > 0) {
          // Take the latest update
          const latestLog = logs[logs.length - 1];
          const { crosswordData } = latestLog.args;
          
          if (crosswordData) {
            try {
              const parsedData = JSON.parse(crosswordData);
              setGridData({
                clues: parsedData.clues,
                gridSize: parsedData.gridSize
              });
            } catch (e) {
              console.error('Error parsing crossword data JSON:', e);
              setError(new Error('Invalid crossword data format'));
            }
          }
        } else {
          // No update event found in the block range
          console.warn(`No CrosswordUpdated event found for ${crosswordId} in the last ${blockRange} blocks`);
          setGridData(null);
        }
      } catch (err) {
        console.error('Error fetching crossword grid data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGridData();
  }, [crosswordId, publicClient, chainId]);

  return { gridData, isLoading, error };
}
