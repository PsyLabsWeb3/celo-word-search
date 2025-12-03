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
        
        if (!contractAddress) {
          throw new Error('Contract address not found');
        }

        // Fetch CrosswordUpdated events for this ID
        // Limit the block range to avoid RPC errors
        // Query only the last 10k blocks instead of from block 0
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
        
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
          // No update event found
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
