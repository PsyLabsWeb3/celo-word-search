"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Home, ChevronDown, ChevronUp, Calendar, Coins } from "lucide-react"
import { useRouter } from "next/navigation"
import { useChainId } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"
import { useGetCrosswordHistory } from "@/hooks/useGetCrosswordHistory"
import { CrosswordHistoryCard } from "@/components/crossword-history-card"
import { LegacyCrosswordHistory } from "@/components/legacy-crossword-history"

export default function HistoryPage() {
  const router = useRouter()
  const chainId = useChainId()
  
  // Future: This will fetch dynamic/all crosswords. 
  // For now, we want to exclude the legacy ones from the "dynamic" list if we were satisfying "all crosswords" query.
  // But useGetCrosswordHistory requires explicit IDs for now or it returns just "current".
  // Since we moved "current" to legacy, we don't want to duplicate it here.
  
  // For now, we'll pass an empty array to useGetCrosswordHistory or just not render it if we don't have new IDs.
  // If we want it to be "dynamic from now on", we likely need a way to discovering IDs (events).
  // But the requirement says "todos los que salgan de ahora en adelante van a ser dinamicos con los puros ids".
  // Assuming the hook handles discovery or we'll add IDs here later.
  // For this step, we just render Legacy and an empty/placeholder dynamic list.

  const legacyIds = [
    '0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2',
    '0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32'
  ];

  // Logic to fetch *other* crosswords would go here. 
  // currently useGetCrosswordHistory(undefined) fetches "current". We want to avoid that if "current" is in legacy.
  // So we will pass an empty array for now to show NO other crosswords.
  const { crosswords: rawDynamicCrosswords, isLoading, isError, hasMore, loadMore } = useGetCrosswordHistory({
    crosswordIds: [] 
  })

  // Filter out legacy IDs to avoid duplicates (since useGetCrosswordHistory defaults to returning current crossword)
  // Also filter out test crosswords
  const dynamicCrosswords = rawDynamicCrosswords.filter(c => 
    !legacyIds.includes(c.crosswordId) && 
    !c.gridData?.isTest
  )

  return (
    <main className="min-h-screen p-4 bg-background sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            {/* <Trophy className="w-16 h-16 text-primary" /> */}
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground sm:text-4xl md:text-5xl">
            Crossword History
          </h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
            Browse past crosswords and their winners
          </p>
        </div>

        {/* Legacy / Hardcoded Crosswords */}
        <div className="mb-8 space-y-4">
             <LegacyCrosswordHistory />
        </div>

        {/* Dynamic / Future Crosswords */}
        {dynamicCrosswords.length > 0 && (
            <div className="space-y-4">
                {dynamicCrosswords.map((crossword) => (
                <CrosswordHistoryCard
                    key={crossword.crosswordId}
                    crosswordId={crossword.crosswordId}
                    token={crossword.token}
                    prizePool={crossword.prizePool}
                    timestamp={crossword.timestamp}
                    initialName={crossword.name}
                    initialSponsoredBy={crossword.sponsoredBy}
                    initialGridData={crossword.gridData ? {
                      ...crossword.gridData,
                      name: crossword.name,
                      sponsoredBy: crossword.sponsoredBy
                    } : crossword.name || crossword.sponsoredBy ? {
                      clues: [],
                      gridSize: { rows: 0, cols: 0 },
                      name: crossword.name,
                      sponsoredBy: crossword.sponsoredBy
                    } : undefined}
                />
                ))}
            </div>
        )}

        {/* Loading State for Dynamic */}
        {isLoading && dynamicCrosswords.length === 0 && (
             <div className="py-8 text-center">
                <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
             </div>
        )}

        {/* Home Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => window.location.href = "/"}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    </main>
  )
}
