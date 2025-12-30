// /app/api/stats/route.ts - API route for fetching cached stats
import { NextRequest } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { celo } from 'viem/chains'
import { CONTRACTS } from '@/lib/contracts'

// Separate caches for legacy and new contracts with TTL
const legacyCache = new Map<string, { data: any; timestamp: number }>();
const newContractCache = new Map<string, { data: any; timestamp: number }>();
const combinedCache = new Map<string, { data: any; timestamp: number }>();

interface TransactionStats {
  totalCompletions: number
  totalPrizeDistributions: number
  totalCrosswordsCreated: number
  totalCeloDistributed: number
  crossword1Completions: number
  crossword2Completions: number
  testCompletions: number
  uniqueUsers: number
  recentTransactions: Array<{
    hash: string
    type: string
    user: string
    timestamp: number
    amount?: string
    contractAddress: string
  }>
  error?: string
}

// Function to fetch data from a single contract with optimized parameters
async function fetchContractData(client: any, address: string, isLegacy: boolean = false) {
  try {
    const fromBlock = isLegacy ? 52500000n : 15000000n; 

    const completedEvents = await client.getLogs({
      address: address as `0x${string}`,
      event: parseAbiItem("event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const prizeEvents = await client.getLogs({
      address: address as `0x${string}`,
      event: parseAbiItem("event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const createdEvents = await client.getLogs({
      address: address as `0x${string}`,
      event: parseAbiItem("event CrosswordCreated(bytes32 indexed crosswordId, address indexed token, uint256 prizePool, address creator)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    return {
      completedEvents: completedEvents.map((event: any) => ({ ...event, contractAddress: address })),
      prizeEvents: prizeEvents.map((event: any) => ({ ...event, contractAddress: address })),
      createdEvents: createdEvents.map((event: any) => ({ ...event, contractAddress: address }))
    };
  } catch (error) {
    console.error(`API: Error fetching data from ${isLegacy ? 'legacy' : 'new'} contract ${address}:`, error);
    return {
      completedEvents: [],
      prizeEvents: [],
      createdEvents: []
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get board history from contracts config
    const chainId = celo.id; // Mainnet stats
    const boardHistory = (CONTRACTS as any)[chainId]?.['BoardHistory'] as string[] || [];
    const currentContractAddress = (CONTRACTS as any)[chainId]?.['CrosswordBoard']?.address as string | undefined;
    
    // Use either the history list or the current address if history is empty
    const contractAddresses = boardHistory.length > 0 ? boardHistory : (currentContractAddress ? [currentContractAddress] : []);

    const CROSSWORD_1_ID = "0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32";
    const CROSSWORD_2_ID = "0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2";

    const cacheKey = `aggregated_stats_${contractAddresses.join('_')}`;
    const cacheDuration = 3 * 60 * 1000; // 3 minutes
    const now = Date.now();

    // Check combined cache
    const cached = combinedCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < cacheDuration) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    // Fetch data for all contracts in history
    const allContractData = await Promise.all(contractAddresses.map(async (address) => {
      const isLegacy = address.toLowerCase() === "0xdc2a624dffc1f6343f62a02001906252e3ca8fd2";
      
      // Use cache per address
      const addressCache = isLegacy ? legacyCache : newContractCache;
      const cachedData = addressCache.get(address);
      
      if (cachedData && (now - cachedData.timestamp) < (isLegacy ? 60 : 5) * 60 * 1000) {
        return cachedData.data;
      }
      
      const freshData = await fetchContractData(client, address, isLegacy);
      addressCache.set(address, { data: freshData, timestamp: now });
      return freshData;
    }));

    // Aggregate results
    const allCompletedEvents = allContractData.flatMap(d => d.completedEvents);
    const allPrizeEvents = allContractData.flatMap(d => d.prizeEvents);
    const allCreatedEvents = allContractData.flatMap(d => d.createdEvents);

    const crossword1 = allCompletedEvents.filter(log => log.args.crosswordId === CROSSWORD_1_ID);
    const crossword2 = allCompletedEvents.filter(log => log.args.crosswordId === CROSSWORD_2_ID);
    const testCrosswords = allCompletedEvents.filter(log =>
      log.args.crosswordId !== CROSSWORD_1_ID && log.args.crosswordId !== CROSSWORD_2_ID
    );

    const uniqueUsersSet = new Set(allCompletedEvents.map(log => log.args.user));
    const totalCelo = allPrizeEvents.reduce((sum, log) => sum + Number(formatEther(log.args.amount || 0n)), 0);

    const allEvents = [
      ...allCompletedEvents.map(e => ({ ...e, type: "Completion" })),
      ...allPrizeEvents.map(e => ({ ...e, type: "Prize" })),
      ...allCreatedEvents.map(e => ({ ...e, type: "Created" }))
    ].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

    const recentTxs = await Promise.all(allEvents.slice(0, 10).map(async (event: any) => {
      try {
        const block = await client.getBlock({ blockNumber: event.blockNumber });
        return {
          hash: event.transactionHash,
          type: event.type,
          user: event.type === "Completion" ? (event.args as any).user : event.type === "Prize" ? (event.args as any).winner : "Admin",
          timestamp: Number(block.timestamp) * 1000,
          amount: event.type === "Prize" ? formatEther((event.args as any).amount || 0n) : undefined,
          contractAddress: event.contractAddress,
        };
      } catch {
        return {
          hash: event.transactionHash,
          type: event.type,
          user: "Unknown",
          timestamp: Date.now(),
          contractAddress: event.contractAddress,
        };
      }
    }));

    const statsData: TransactionStats = {
      totalCompletions: allCompletedEvents.length,
      totalPrizeDistributions: allPrizeEvents.length,
      totalCrosswordsCreated: allCreatedEvents.length,
      totalCeloDistributed: totalCelo,
      crossword1Completions: crossword1.length,
      crossword2Completions: crossword2.length,
      testCompletions: testCrosswords.length,
      uniqueUsers: uniqueUsersSet.size,
      recentTransactions: recentTxs,
    };

    combinedCache.set(cacheKey, { data: statsData, timestamp: now });
    return new Response(JSON.stringify(statsData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("API: Error fetching stats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}