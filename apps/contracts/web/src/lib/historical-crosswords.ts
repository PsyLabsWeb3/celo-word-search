// web/src/lib/historical-crosswords.ts

import { CrosswordCompletion } from './../useGetCrosswordHistory'; // Corrected path

interface HistoricalCrosswordData {
  crosswordId: `0x${string}`;
  token?: string;
  prizePool?: string;
  timestamp?: number;
  completions?: CrosswordCompletion[];
}

const HISTORICAL_CROSSWORDS: { [key: `0x${string}`]: HistoricalCrosswordData } = {
  // CELO Ecosystem (Example ID, replace with actual ID)
  '0x451234567890123456789012345678901234567890123456789012345678901e': { // Placeholder ID
    crosswordId: '0x451234567890123456789012345678901234567890123456789012345678901e',
    token: '0x0000000000000000000000000000000000000000', // Example token
    prizePool: '1000000000000000000', // Example prize pool (1 CELO)
    timestamp: 1678886400, // Example timestamp
    completions: [
      {
        user: '0x997c728798C0B29b82143004e0e56214150C6f24',
        timestamp: 1678886460,
        rank: 1,
        displayName: 'user1_fc',
        pfpUrl: 'https://cdn.farcaster.xyz/avatar/user1.png',
      },
      {
        user: '0xf0574f83b63dE52bB11a91dD23c509A8F5BfEe64',
        timestamp: 1678886520,
        rank: 2,
        displayName: 'user2_fc',
        pfpUrl: 'https://cdn.farcaster.xyz/avatar/user2.png',
      },
    ],
  },
  // Crossword Genesis (Example ID, replace with actual ID)
  '0x451234567890123456789012345678901234567890123456789012345678902e': { // Placeholder ID
    crosswordId: '0x451234567890123456789012345678901234567890123456789012345678902e',
    token: '0x0000000000000000000000000000000000000000', // Example token
    prizePool: '500000000000000000', // Example prize pool (0.5 CELO)
    timestamp: 1678790000, // Example timestamp
    completions: [
      {
        user: '0x8E65F87B5c26b86A0b70129B890Ff23dF4e7b186',
        timestamp: 1678790060,
        rank: 1,
        displayName: 'user3_fc',
        pfpUrl: 'https://cdn.farcaster.xyz/avatar/user3.png',
      },
      {
        user: '0xf802b542A1D0B79E797931c8F3b1234e45cEBD0',
        timestamp: 1678790120,
        rank: 2,
        displayName: 'user4_fc',
        pfpUrl: 'https://cdn.farcaster.xyz/avatar/user4.png',
      },
    ],
  },
};

export function getHistoricalCrosswordData(crosswordId: `0x${string}`): HistoricalCrosswordData | undefined {
  return HISTORICAL_CROSSWORDS[crosswordId];
}
