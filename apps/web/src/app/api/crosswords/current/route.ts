import { NextResponse } from 'next/server';
import { createPublicClient, http, defineChain } from 'viem';

// Celo Mainnet Definition (Reuse or import shared config in refactor)
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

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS as `0x${string}`;

// Minimal ABI for getCurrentCrossword
const ABI = [
  {
    "inputs": [],
    "name": "getCurrentCrossword",
    "outputs": [
      { "internalType": "bytes32", "name": "crosswordId", "type": "bytes32" },
      { "internalType": "string", "name": "crosswordData", "type": "string" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const dynamic = 'force-dynamic'; // No caching, always real-time

export async function GET(req: Request) {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http(),
    });

    const [crosswordId, crosswordData, updatedAt] = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'getCurrentCrossword',
    });

    // Parse and sanitize to remove answers
    let sanitizedData = crosswordData;
    try {
      const parsed = JSON.parse(crosswordData);
      if (parsed.clues && Array.isArray(parsed.clues)) {
        parsed.clues = parsed.clues.map((clue: any) => {
          const { answer, ...rest } = clue;
          return rest;
        });
      }
      sanitizedData = JSON.stringify(parsed);
    } catch (e) {
      console.warn('Failed to sanitize crossword data', e);
    }

    return NextResponse.json({
      crosswordId,
      crosswordData: sanitizedData,
      updatedAt: updatedAt.toString()
    });

  } catch (error: any) {
    console.error('Current Crossword Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
