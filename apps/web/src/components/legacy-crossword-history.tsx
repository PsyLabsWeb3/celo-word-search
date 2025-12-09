"use client"

import { useGetCrosswordHistory } from "@/hooks/useGetCrosswordHistory"
import { CrosswordHistoryCard } from "@/components/crossword-history-card"

export function LegacyCrosswordHistory() {
  const legacyIds: `0x${string}`[] = [
    '0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2', // second/Latest
    '0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32'  // First historical
  ];

  const { crosswords, isLoading } = useGetCrosswordHistory({
    crosswordIds: legacyIds
  })

  // Sort by timestamp descending
  const sortedCrosswords = [...crosswords].sort((a, b) => 
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  if (isLoading && crosswords.length === 0) {
    return (
        <div className="space-y-4">
            <div className="py-4 text-center">
                 <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                 <p className="mt-2 text-sm font-bold">Loading legacy crosswords...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedCrosswords.map((crossword) => (
        <CrosswordHistoryCard
          key={crossword.crosswordId}
          crosswordId={crossword.crosswordId}
          token={crossword.token}
          prizePool={crossword.prizePool}
          timestamp={crossword.timestamp}
        />
      ))}
    </div>
  )
}
