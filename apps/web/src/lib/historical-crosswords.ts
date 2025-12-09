// Historical crossword data for crosswords that are no longer active
// This is needed because querying old events from RPC providers causes errors

interface HistoricalCrosswordData {
  name?: string; // Crossword name/title
  clues: any[];
  gridSize: { rows: number; cols: number };
  prizePool?: string; // in wei
  token?: string; // address
  timestamp?: number;
  completions?: {
    user: string;
    timestamp: number;
    rank: number;
    durationMs?: string;
  }[];
}

export const HISTORICAL_CROSSWORDS: Record<string, HistoricalCrosswordData> = {
  // First crossword - Nov 2025 - "Crossword Genesis"
  '0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32': {
    name: "Crossword Genesis",
    gridSize: { rows: 9, cols: 10 },
    prizePool: "5000000000000000000", // 5 CELO
    token: "0x0000000000000000000000000000000000000000",
    timestamp: 1732944000,

    clues: [
      {
        number: 1,
        clue: "Ethereum creator",
        answer: "VITALIK",
        row: 0,
        col: 1,
        direction: "across"
      },
      {
        number: 2,
        clue: "Node participating in on-chain elections and PoS consensus.",
        answer: "VALIDATOR",
        row: 0,
        col: 1,
        direction: "down"
      },
      {
        number: 3,
        clue: "Fee measuring computational cost; on Celo can be paid using cUSD or cEUR.",
        answer: "GAS",
        row: 5,
        col: 0,
        direction: "across"
      },
      {
        number: 4,
        clue: "Ethereum L2 powering fast, low-cost payments, native stablecoins, and DeFi apps",
        answer: "CELO",
        row: 2,
        col: 4,
        direction: "across"
      },
      {
        number: 5,
        clue: "Celo's native stablecoin backed by a diversified reserve.",
        answer: "CUSD",
        row: 2,
        col: 4,
        direction: "down"
      },
      {
        number: 6,
        clue: "Service that supplies verifiable off-chain data (e.g., price feeds) so smart contracts can maintain stability or external logic.",
        answer: "ORACLE",
        row: 2,
        col: 7,
        direction: "down"
      },
      {
        number: 7,
        clue: "Deterministic virtual machine that runs Solidity bytecode; Celo is fully compatible so contracts deploy without changes.",
        answer: "EVM",
        row: 7,
        col: 7,
        direction: "across"
      }
    ]
  },
  // Second crossword - Dec 2025 - "CELO Ecosystem"
  '0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2': {
    name: "CELO Ecosystem",
    gridSize: { "rows": 9, "cols": 10 },
    clues: [
      { "number": 1, "clue": "Universal basic income protocol on Celo focused on financial inclusion.", "answer": "GOODDOLLAR", "row": 1, "col": 0, "direction": "across" },
      { "number": 2, "clue": "Celo’s lightweight mobile wallet designed for fast, low-cost payments.", "answer": "MINIPAY", "row": 3, "col": 3, "direction": "across" },
      { "number": 3, "clue": "Stablecoin protocol powering assets like cUSD, cEUR, and cREAL.", "answer": "MENTO", "row": 3, "col": 3, "direction": "down" },
      { "number": 4, "clue": "Celo’s naming service that lets users register human-readable blockchain names.", "answer": "NAMES", "row": 5, "col": 3, "direction": "across" },
      { "number": 5, "clue": "Decentralized identity protocol enabling portable and verifiable credentials.", "answer": "SELF", "row": 5, "col": 7, "direction": "down" },
      { "number": 6, "clue": "Celo staking and governance plataform", "answer": "MONDO", "row": 0, "col": 1, "direction": "down" }
    ]
  }
};

export function getHistoricalCrosswordData(crosswordId: string): HistoricalCrosswordData | null {
  return HISTORICAL_CROSSWORDS[crosswordId] || null;
}
