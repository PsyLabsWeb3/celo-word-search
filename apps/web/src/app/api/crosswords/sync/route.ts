import { NextResponse } from 'next/server';
import { createPublicClient, http, defineChain } from 'viem';
import { supabase } from '@/lib/supabase-client';

// Celo Mainnet Definition
const celo = defineChain({
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://celoscan.io' },
  },
});

// const CONTRACT_ADDRESS = '0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648';
const CONTRACT_ADDRESS =  process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS as `0x${string}`;

export const maxDuration = 60; // Allow 60 seconds for execution (Vercel generic limit)

export async function POST(req: Request) {
  try {
    // 1. Initialize Client
    const client = createPublicClient({
      chain: celo,
      transport: http(),
    });

    // 2. Determine start block
    // Ideally, we query the DB for the latest block_number.
    // For simplicity in this v1, we'll check the last stored crossword or default to a recent block.
    
    const { data: latestCrossword, error: latError } = await supabase
      .from('crosswords')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();

    if (latError && latError.code !== 'PGRST116') { // PGRST116 is "Row not found" (empty table), which is fine
        console.error('Supabase connection check failed:', latError);
        throw new Error(`Supabase connection failed: ${latError.message}`);
    }

    // Default to a recent block if table is empty (e.g. last 50,000 blocks ~ 2-3 days)
    // This prevents timeout on public RPCs.
    const toBlock = await client.getBlockNumber();
    
    // If we have a latest block, start from there + 1
    // Otherwise, start from mostly recent history
    const fromBlock = latestCrossword?.block_number 
      ? BigInt(latestCrossword.block_number) + 1n 
      : toBlock - 50000n; 

    console.log(`Syncing crosswords from block ${fromBlock} to ${toBlock}...`);

    if (fromBlock > toBlock) {
       return NextResponse.json({ message: 'Already up to date', count: 0 });
    }

    // 3. Fetch Logs
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'CrosswordCreated',
        inputs: [
            { name: 'crosswordId', type: 'bytes32', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'prizePool', type: 'uint256', indexed: false },
            { name: 'creator', type: 'address', indexed: false }
        ]
      },
      fromBlock,
      toBlock
    });

    if (logs.length === 0) {
        return NextResponse.json({ message: 'No new crosswords found', count: 0, fromBlock: fromBlock.toString(), toBlock: toBlock.toString() });
    }

    // 4. Transform and Insert
    const records = await Promise.all(logs.map(async (log) => {
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      
      return {
        id: log.args.crosswordId,
        token: log.args.token,
        prize_pool: log.args.prizePool?.toString(),
        created_at: new Date(Number(block.timestamp) * 1000).toISOString(),
        creator: log.args.creator,
        block_number: Number(log.blockNumber),
        metadata: {} // Placeholder for future data
      };
    }));

    // Upsert (ignore duplicates)
    const { error } = await supabase
      .from('crosswords')
      .upsert(records, { onConflict: 'id' });

    if (error) {
       console.error('Supabase error:', error);
       throw new Error(error.message);
    }

    return NextResponse.json({ 
        success: true, 
        count: records.length, 
        message: `Synced ${records.length} crosswords` 
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
