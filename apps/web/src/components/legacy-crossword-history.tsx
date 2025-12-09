"use client"

import { CrosswordHistoryCard } from "@/components/crossword-history-card"
import { getHistoricalCrosswordData } from "@/lib/historical-crosswords"

export function LegacyCrosswordHistory() {
  const legacyIds: `0x${string}`[] = [
    '0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2', // second/Latest
    '0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32'  // First historical
  ];

  const crosswords = legacyIds.map(id => {
      const data = getHistoricalCrosswordData(id);
      if (!data) return null;
      return {
          crosswordId: id,
          token: data.token || "0x0000000000000000000000000000000000000000",
          prizePool: BigInt(data.prizePool || "0"),
          timestamp: data.timestamp,
          completions: data.completions,
          gridSize: data.gridSize,
          clues: data.clues,
          winnerCount: data.winnerCount,
          name: data.name,
          sponsoredBy: data.sponsoredBy
      }
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  // Sort by timestamp descending
  const sortedCrosswords = crosswords.sort((a, b) =>
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  return (
    <div className="space-y-4">
      {sortedCrosswords.map((crossword) => (
        <CrosswordHistoryCard
          key={crossword.crosswordId}
          crosswordId={crossword.crosswordId}
          token={crossword.token}
          prizePool={crossword.prizePool}
          timestamp={crossword.timestamp}
          initialName={crossword.name}
          initialSponsoredBy={crossword.sponsoredBy}
          initialCompletions={crossword.completions}
          initialGridData={{ clues: crossword.clues, gridSize: crossword.gridSize, name: crossword.name, sponsoredBy: crossword.sponsoredBy }}
          initialWinnerCount={crossword.winnerCount}
          isLegacy={true} // Indicate this is a legacy crossword
        />
      ))}
    </div>
  )
}
