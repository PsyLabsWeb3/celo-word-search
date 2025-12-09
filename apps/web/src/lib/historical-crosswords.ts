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
  winnerCount?: number;
}


export const HISTORICAL_CROSSWORDS: Record<string, HistoricalCrosswordData> = {
  // First crossword - Nov 2025 - "Crossword Genesis"
  '0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32': {
    name: "Crossword Genesis",
    gridSize: { rows: 9, cols: 10 },
    prizePool: "5000000000000000000", // 5 CELO
    token: "0x0000000000000000000000000000000000000000",
    timestamp: 1764590400, // Dec 1 2025 12:00 UTC

    winnerCount: 4,


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
    ],
    completions: [
      { user: "0x0c9Adb5b5483130F88F10DB4978772986B1E953B", timestamp: 1764587106, durationMs: "25613", rank: 1 },
      { user: "0x3b760888600d71Fac7B87873e21334D89c05a78a", timestamp: 1764620070, durationMs: "64037", rank: 2 },
      { user: "0x707D9DEfC3C6620696594a0193d5273cDfb9EdA3", timestamp: 1764629866, durationMs: "123052", rank: 3 },
      { user: "0x2922fe10cCEBDC125bBF86373877049e558D64b7", timestamp: 1764635340, durationMs: "52197", rank: 4 },
      { user: "0x43F8C3E0C0Ab23F0a8660F3eA3CE1a7016f96a33", timestamp: 1764703699, durationMs: "130907", rank: 5 },
      { user: "0x0C1732ce5FBA93b333bAB594c0C59A2c2a913E68", timestamp: 1764704409, durationMs: "512338", rank: 6 },
      { user: "0xf80228fF49e4e57fb93a10cFF2B098B078d4EBD0", timestamp: 1764704429, durationMs: "936121", rank: 7 },
      { user: "0xf458d33BE0ecb485C6F324fEcB2aa8B0dD59a718", timestamp: 1764704675, durationMs: "83146", rank: 8 },
      { user: "0x62962b2e83fee98743bDCeb936cc5E4Fb6db7511", timestamp: 1764704819, durationMs: "33117", rank: 9 },
      { user: "0x71C1819a2282A475C7274525Ca310fea9ee57dA4", timestamp: 1764704932, durationMs: "28251", rank: 10 },
      { user: "0xB365F1B6F0D55c8B8A79Ce2e96c5e23d38E9A851", timestamp: 1764705184, durationMs: "24787", rank: 11 },
      { user: "0xf9a72710FD34dE7CaACB98520cf53Aa97d6787aF", timestamp: 1764705332, durationMs: "23557", rank: 12 },
      { user: "0x8dC1426FA34dc5AA3cB1e3f2e6B980C7215F83d5", timestamp: 1764712072, durationMs: "380898", rank: 13 },
      { user: "0x3349f432DAdc327D8B8a6234D8ed43bc0109C01B", timestamp: 1764715274, durationMs: "222034", rank: 14 },
      { user: "0xF277131C0226a318953F781275918e4Cc8d5406f", timestamp: 1764716185, durationMs: "215457", rank: 15 },
      { user: "0x01d2F10a2CDe4047292b5f4c6CB590E94f00bBD6", timestamp: 1764716421, durationMs: "42364", rank: 16 },
      { user: "0x64608C2d5E4685830348e9155bAB423bf905E9c9", timestamp: 1764733297, durationMs: "311621", rank: 17 },
      { user: "0x6a1d67C2DaC920796D8B17C16452F880AE22b2ed", timestamp: 1764746046, durationMs: "516215", rank: 18 },
      { user: "0xb3B6Bb3Ba7F10CC9B6d51964EFf169DF0e2479E1", timestamp: 1764753484, durationMs: "433296", rank: 19 },
      { user: "0xE2dBA70a6e9897226aF8A803cA4f8c4127b5ED93", timestamp: 1764756868, durationMs: "633478", rank: 20 },
      { user: "0x96d821b36768A4e8dBc1b66B721221Fd91F7f936", timestamp: 1764762104, durationMs: "555347", rank: 21 },
      { user: "0x8E651FC644498705AC48E5947d68be8B96E6b186", timestamp: 1764768120, durationMs: "68024", rank: 22 },
      { user: "0x4920025e58c52B9aAE8444aB7724b9B85f5b5d05", timestamp: 1764768481, durationMs: "65094", rank: 23 },
      { user: "0xEdb85C2bE4861c707eD792142526A985D4E8C18e", timestamp: 1764774948, durationMs: "58706", rank: 24 }
    ]
  },
  // Second crossword - Dec 2025 - "CELO Ecosystem"
  '0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2': {
    name: "CELO Ecosystem",
    gridSize: { "rows": 9, "cols": 10 },
    timestamp: 1764763200, // Dec 3 2025 12:00 UTC
    winnerCount: 10,

    prizePool: "100000000000000000000", // 5 CELO

    clues: [
      { "number": 1, "clue": "Universal basic income protocol on Celo focused on financial inclusion.", "answer": "GOODDOLLAR", "row": 1, "col": 0, "direction": "across" },
      { "number": 2, "clue": "Celo’s lightweight mobile wallet designed for fast, low-cost payments.", "answer": "MINIPAY", "row": 3, "col": 3, "direction": "across" },
      { "number": 3, "clue": "Stablecoin protocol powering assets like cUSD, cEUR, and cREAL.", "answer": "MENTO", "row": 3, "col": 3, "direction": "down" },
      { "number": 4, "clue": "Celo’s naming service that lets users register human-readable blockchain names.", "answer": "NAMES", "row": 5, "col": 3, "direction": "across" },
      { "number": 5, "clue": "Decentralized identity protocol enabling portable and verifiable credentials.", "answer": "SELF", "row": 5, "col": 7, "direction": "down" },
      { "number": 6, "clue": "Celo staking and governance plataform", "answer": "MONDO", "row": 0, "col": 1, "direction": "down" }
    ],
    completions: [
      { user: "0x997c71BB2b7D5814C99494d534dB264E1702f245", timestamp: 1764838637, durationMs: "1029596", rank: 1 },
      { user: "0xf057491474d0C47C410D3d90d5f1DB170818ee64", timestamp: 1764849344, durationMs: "492432", rank: 2 },
      { user: "0x8E651FC644498705AC48E5947d68be8B96E6b186", timestamp: 1764850914, durationMs: "2369451", rank: 3 },
      { user: "0xf80228fF49e4e57fb93a10cFF2B098B078d4EBD0", timestamp: 1764876105, durationMs: "369146", rank: 4 },
      { user: "0x5cbEEB487a6F7a65E480a38fff7b4537a8D1C874", timestamp: 1764876141, durationMs: "301335", rank: 5 },
      { user: "0x71C1819a2282A475C7274525Ca310fea9ee57dA4", timestamp: 1764876222, durationMs: "58698", rank: 6 },
      { user: "0xf9a72710FD34dE7CaACB98520cf53Aa97d6787aF", timestamp: 1764876314, durationMs: "48268", rank: 7 },
      { user: "0xB365F1B6F0D55c8B8A79Ce2e96c5e23d38E9A851", timestamp: 1764876369, durationMs: "28162", rank: 8 },
      { user: "0xdD92a2f7CA94D2B4f2eBb3B5776613BCad9C57f4", timestamp: 1764876393, durationMs: "32951", rank: 9 },
      { user: "0xA9FbC6DB0715f248bfDC067cdd392F7Ae49E34Fc", timestamp: 1764876485, durationMs: "931021", rank: 10 },
      { user: "0xf458d33BE0ecb485C6F324fEcB2aa8B0dD59a718", timestamp: 1764876499, durationMs: "27160", rank: 11 },
      { user: "0x62962b2e83fee98743bDCeb936cc5E4Fb6db7511", timestamp: 1764876585, durationMs: "31413", rank: 12 },
      { user: "0x6EAff51A8229e4f5CfA11080a3455DF7A3804E32", timestamp: 1764876980, durationMs: "190975", rank: 13 },
      { user: "0x2922fe10cCEBDC125bBF86373877049e558D64b7", timestamp: 1764877132, durationMs: "553426", rank: 14 },
      { user: "0x0c9Adb5b5483130F88F10DB4978772986B1E953B", timestamp: 1764877419, durationMs: "114293", rank: 15 },
      { user: "0x275aB0037e50BDA1cdA147e3Ac9AeaeFB3D21E85", timestamp: 1764877502, durationMs: "958341", rank: 16 },
      { user: "0x0C1732ce5FBA93b333bAB594c0C59A2c2a913E68", timestamp: 1764877942, durationMs: "744541", rank: 17 },
      { user: "0xB3A1966DA737C87009e52a79904cc40f2F395DA6", timestamp: 1764878446, durationMs: "373110", rank: 18 },
      { user: "0x87417b52De1F9D8B17F363B95da8689CeaFf0ba1", timestamp: 1764879371, durationMs: "122754", rank: 19 },
      { user: "0xD2C50e9Da15bB2277985b1D6B5D143D6D1BC2fEF", timestamp: 1764879744, durationMs: "35582", rank: 20 },
      { user: "0x6a1d67C2DaC920796D8B17C16452F880AE22b2ed", timestamp: 1764883995, durationMs: "1310316", rank: 21 },
      { user: "0x65a4b717D9950CC364aA37a89a78c2beF3559200", timestamp: 1764884024, durationMs: "498211", rank: 22 },
      { user: "0xf41f330E50FACBe44c2cDA91319B78AB67288e8e", timestamp: 1764885535, durationMs: "389233", rank: 23 },
      { user: "0xC29EdE0ea5bC28dcB0ecfC1AD8Ba2B52F73b5818", timestamp: 1764887380, durationMs: "881945", rank: 24 },
      { user: "0x5966304752F58a95d1d810b56D33bA3BEa2147cF", timestamp: 1764888268, durationMs: "355767", rank: 25 },
      { user: "0x03C25E5Fa3b220F7aD11809149b069856DE08e4a", timestamp: 1764905062, durationMs: "401022", rank: 26 },
      { user: "0x4920025e58c52B9aAE8444aB7724b9B85f5b5d05", timestamp: 1764931841, durationMs: "112607", rank: 27 },
      { user: "0xCF8FD219B88545DaDC66231BFF1391c28A0Ec3b8", timestamp: 1764949031, durationMs: "3558575", rank: 28 },
      { user: "0x144e1547AD7be53ED5F751406a661540B860D522", timestamp: 1764952020, durationMs: "2454774", rank: 29 },
      { user: "0xc67483B416103918F7b129b18610Bb3cAA3fdDc8", timestamp: 1764956405, durationMs: "1135002", rank: 30 },
      { user: "0xdd5c9Dd401901975FB96Be84374D5Edc6cBC0f4D", timestamp: 1765122864, durationMs: "1920690", rank: 31 },
      { user: "0xB6Bb848A8E00b77698CAb1626C893dc8ddE4927c", timestamp: 1765197085, durationMs: "791221", rank: 32 },
      { user: "0x89cB36F8B29084E883738A0708f1abc6e4C25c07", timestamp: 1765228779, durationMs: "446325", rank: 33 }
    ]
  }
};

export function getHistoricalCrosswordData(crosswordId: string): HistoricalCrosswordData | null {
  return HISTORICAL_CROSSWORDS[crosswordId] || null;
}
