import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import { celo } from 'viem/chains';

interface NewContractStats {
  completedEvents: any[];
  prizeEvents: any[];
  loading: boolean;
  error: string | null;
}

export const useNewContractStats = (contractAddress: string) => {
  const [stats, setStats] = useState<NewContractStats>({
    completedEvents: [],
    prizeEvents: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchContractStats = async () => {
      if (!contractAddress) {
        setStats({
          completedEvents: [],
          prizeEvents: [],
          loading: false,
          error: 'Contract address is required',
        });
        return;
      }

      try {
        const client = createPublicClient({
          chain: celo,
          transport: http('https://forno.celo.org'),
        });

        // Fetch CrosswordCompleted events
        const completedEvents = await client.getLogs({
          address: contractAddress as `0x${string}`,
          event: parseAbiItem(
            'event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs)'
          ),
          fromBlock: 0n, // Changed from 52500000n to 0n to get all events from contract creation
          toBlock: 'latest',
        });

        // Fetch PrizeDistributed events
        const prizeEvents = await client.getLogs({
          address: contractAddress as `0x${string}`,
          event: parseAbiItem(
            'event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank)'
          ),
          fromBlock: 0n, // Changed from 52500000n to 0n to get all events from contract creation
          toBlock: 'latest',
        });

        setStats({
          completedEvents,
          prizeEvents,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error(`Error fetching data from new contract ${contractAddress}:`, error);
        setStats({
          completedEvents: [],
          prizeEvents: [],
          loading: false,
          error: `Error fetching data from new contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };

    fetchContractStats();
  }, [contractAddress]);

  return stats;
};