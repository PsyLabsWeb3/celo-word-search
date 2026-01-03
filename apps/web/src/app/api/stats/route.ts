// /app/api/stats/route.ts - API route for fetching aggregated stats from blockchain and Supabase cache
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { celo } from 'viem/chains'
import { supabase } from '@/lib/supabase-client'
import LEGACY_STATS from '@/lib/data/legacy-stats.json'

// Separate caches for legacy and new contracts with TTL
const newContractCache = new Map<string, { data: any; timestamp: number }>();

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
}

// Timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
    ]);
};

async function fetchContractData(client: any, address: string) {
  try {
    // Modular contracts were deployed around block 55.4M. 
    // Optimization: Skip history before this block.
    const fromBlock = 55300000n; 

    const [completedEvents, prizeEvents, createdEvents] = await Promise.all([
      client.getLogs({
        address: address as `0x${string}`,
        event: parseAbiItem("event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs)"),
        fromBlock,
        toBlock: "latest",
      }),
      client.getLogs({
        address: address as `0x${string}`,
        event: parseAbiItem("event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank)"),
        fromBlock,
        toBlock: "latest",
      }),
      client.getLogs({
        address: address as `0x${string}`,
        event: parseAbiItem("event CrosswordCreated(bytes32 indexed crosswordId, address indexed token, uint256 prizePool, address creator)"),
        fromBlock,
        toBlock: "latest",
      })
    ]);

    return {
      completedEvents: completedEvents.map((event: any) => ({ ...event, contractAddress: address })),
      prizeEvents: prizeEvents.map((event: any) => ({ ...event, contractAddress: address })),
      createdEvents: createdEvents.map((event: any) => ({ ...event, contractAddress: address }))
    };
  } catch (error) {
    console.error(`API: Error fetching modular data from ${address}:`, error);
    return { completedEvents: [], prizeEvents: [], createdEvents: [] };
  }
}

export async function GET() {
  try {
    const now = Date.now();
    
    // 1. Check Supabase Cache with Strict Timeout (5s)
    try {
      const cachedResponse = await withTimeout(
        (async () => {
          const res = await supabase.from('app_stats').select('*').eq('id', 1).single();
          return res;
        })(),
        5000,
        "Supabase Timeout"
      );

      if (cachedResponse.data?.data) {
        const lastUpdate = new Date(cachedResponse.data.updated_at).getTime();
        const isFresh = (now - lastUpdate) < 5 * 60 * 1000; // 5 mins fresh

        if (isFresh) {
          return NextResponse.json(cachedResponse.data.data);
        }
      }
    } catch (err) {
      console.warn("API: Supabase cache lookup failed or timed out", err);
    }

    // 2. Blockchain Fetch (Modular Contracts Only)
    const modularContracts = [
        "0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2", // CrosswordCore
        "0x754b33d8aded1c6bf4821ea68158c42b434d781f", // CrosswordPrizes
        "0xdc2b0c154f48c7e235872208a6f3093647a236a7"  // PublicCrosswordManager
    ];
    
    const CROSSWORD_1_ID = "0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32";
    const CROSSWORD_2_ID = "0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2";

    const client = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org", {
          timeout: 10000, // 10s per RPC call
          retryCount: 1
      })
    });

    const allContractData = await Promise.all(modularContracts.map(async (address) => {
      const cached = newContractCache.get(address);
      if (cached && (now - cached.timestamp) < 5 * 60 * 1000) return cached.data;
      
      const freshData = await fetchContractData(client, address);
      newContractCache.set(address, { data: freshData, timestamp: now });
      return freshData;
    }));

    const allCompleted = allContractData.flatMap(d => d.completedEvents);
    const allPrize = allContractData.flatMap(d => d.prizeEvents);
    const allCreated = allContractData.flatMap(d => d.createdEvents);

    const totalCelo = allPrize.reduce((acc, e) => acc + Number(formatEther((e.args as any).amount || 0n)), 0);
    const uniqueUsersSet = new Set(allCompleted.map(e => (e.args as any).user));

    const crossword1 = allCompleted.filter(e => (e.args as any).crosswordId === CROSSWORD_1_ID);
    const crossword2 = allCompleted.filter(e => (e.args as any).crosswordId === CROSSWORD_2_ID);
    const testCrosswords = allCompleted.filter(e => (e.args as any).crosswordId !== CROSSWORD_1_ID && (e.args as any).crosswordId !== CROSSWORD_2_ID);

    const allEvents = [
      ...allCompleted.map(e => ({ ...e, type: 'Completion' })),
      ...allPrize.map(e => ({ ...e, type: 'Prize' })),
      ...allCreated.map(e => ({ ...e, type: 'Created' }))
    ].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

    const recentTxs = allEvents.slice(0, 10).map(event => ({
      hash: event.transactionHash,
      type: event.type,
      user: (event.args as any).user || (event.args as any).winner || (event.args as any).creator || "Admin",
      timestamp: now, // Real timestamp fetching is too slow for 10 txs on public RPC
      amount: (event.args as any).amount ? formatEther((event.args as any).amount) : undefined,
      contractAddress: event.address
    }));

    const statsData: TransactionStats = {
      totalCompletions: allCompleted.length + LEGACY_STATS.totalCompletions,
      totalPrizeDistributions: allPrize.length + LEGACY_STATS.totalPrizeDistributions,
      totalCrosswordsCreated: allCreated.length + LEGACY_STATS.totalCrosswordsCreated,
      totalCeloDistributed: totalCelo + LEGACY_STATS.totalCeloDistributed,
      crossword1Completions: crossword1.length,
      crossword2Completions: crossword2.length,
      testCompletions: testCrosswords.length,
      uniqueUsers: uniqueUsersSet.size + LEGACY_STATS.uniqueUsersCount,
      recentTransactions: recentTxs,
    };

    // 3. Update Supabase Cache (Non-blocking)
    supabase
      .from('app_stats')
      .upsert({ id: 1, data: statsData, updated_at: new Date().toISOString() })
      .then(response => {
        if (response.error) {
          console.error("API: Background Supabase update failed", response.error.message);
        }
      })
      .catch(err => {
        console.error("API: Background Supabase update crash", err)
      });

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("API Fatal Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}