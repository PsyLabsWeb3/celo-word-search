"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, ChevronDown, ChevronUp, Calendar, Coins } from "lucide-react"
import { useGetCrosswordDetailsById, useGetCrosswordCompletions } from "@/hooks/useContract"
import FarcasterUserDisplay from "@/components/farcaster-user-display"
import FarcasterUserDisplayLegacy from "@/components/farcaster-user-display-legacy"
import { useGetCrosswordGridData } from "@/hooks/useGetCrosswordGridData"
import ReadOnlyCrosswordGrid from "@/components/readonly-crossword-grid"
import { useCrossword } from "@/contexts/crossword-context"

// Component for individual crossword history item
export function CrosswordHistoryCard({
  crosswordId,
  token,
  prizePool,
  timestamp,
  initialCompletions,
  initialGridData,
  initialName,
  initialSponsoredBy,
  initialWinnerCount,
  isLegacy = false
}: {
  crosswordId: `0x${string}`
  token: string
  prizePool: bigint
  timestamp?: number
  initialCompletions?: any[]
  initialGridData?: { clues: any[]; gridSize: { rows: number; cols: number }; name?: string; sponsoredBy?: string }
  initialName?: string
  initialSponsoredBy?: string
  initialWinnerCount?: number
  isLegacy?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  // Use initial data if provided, otherwise fetch
  const shouldFetch = isExpanded && !initialCompletions
  
  const { data: details, isLoading: isDetailsLoading } = useGetCrosswordDetailsById(shouldFetch ? crosswordId : undefined)
  // Type assertion for details structure: [token, totalPrizePool, winnerPercentages, completions, activationTime, endTime, state, name, gridData, sponsoredBy]
  type DetailsType = [string, bigint, bigint[], any[], bigint, bigint, number, string, string, string] | undefined;
  const { data: completionsData, isLoading: isCompletionsLoading } = useGetCrosswordCompletions(shouldFetch ? crosswordId : `0x0000000000000000000000000000000000000000000000000000000000000000`)
  // Always load grid data for preview (unless provided)
  const { gridData, isLoading: isGridLoading } = useGetCrosswordGridData(!initialGridData ? crosswordId : undefined)
  const { currentCrossword } = useCrossword()

  // Pagination for completions
  const [customLimit, setCustomLimit] = useState<number | null>(null)

  // Determine number of winners based on winnerPercentages length or initial count
  const winnerCount = initialWinnerCount ?? (details && Array.isArray(details) && details[2] ? (details[2] as any[]).length : 3)

  // Calculate effective limit: use custom limit if set, otherwise default to winner count
  const visibleCompletions = customLimit ?? winnerCount

  const handleViewMore = () => {
    if (visibleCompletions < 10) {
      setCustomLimit(10)
    } else {
      setCustomLimit(visibleCompletions + 10)
    }
  }

  // Fallback grid data from context if it's the current crossword
  const contextGridData = (currentCrossword?.id === crosswordId && currentCrossword?.data)
    ? (() => {
      try {
        const parsed = JSON.parse(currentCrossword.data)
        return { clues: parsed.clues, gridSize: parsed.gridSize }
      } catch (e) { return null }
    })()
    : null

  const effectiveGridData = initialGridData || gridData || contextGridData
  // Extract name from all possible sources (added initialName prop as priority)
  const crosswordName = initialName || initialGridData?.name || (effectiveGridData && (effectiveGridData as any).name) || (details && (details as any)[7])
  // Extract sponsoredBy from all possible sources (position 9 in details array) (added initialSponsoredBy prop as priority)
  const crosswordSponsoredBy = initialSponsoredBy || initialGridData?.sponsoredBy || (effectiveGridData && (effectiveGridData as any).sponsoredBy) || (details && (details as any)[9])

  const formatDate = (ts: number) => {
    const date = new Date(ts * 1000)
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Use prize pool from details if available, otherwise use prop
  const effectivePrizePool = details && Array.isArray(details) && (details as any)[1] ? (details as any)[1] : prizePool

  const formatPrizePool = (amount: bigint) => {
    const formatted = Number(amount) / 1e18
    return formatted.toFixed(2)
  }

  const isNativeCelo = token === "0x0000000000000000000000000000000000000000"

  // Helper functions to handle both tuple-style and object-style completion data
  const getCompletionUser = (completion: any): string => {
    return completion.user ?? completion[0]
  }

  const getCompletionTimestamp = (completion: any): bigint => {
    return completion.timestamp ?? completion[1] ?? completion.completionTimestamp
  }

  const getCompletionRank = (completion: any): bigint => {
    return completion.rank ?? completion[2]
  }

  const getCompletionDuration = (completion: any): bigint => {
    // Duration might not be available in all contexts, fallback to 0
    return completion.durationMs ?? 0n;
  }

  const getRankIcon = (index: number) => {
    const rank = index + 1;
    const fontSize = rank >= 10 ? "text-lg" : "text-2xl";
    return <span className={`${fontSize} font-black text-primary`}>{rank}</span>
  }

  const getRankColor = (index: number) => {
    if (index === 0) return "bg-yellow-300"
    if (index === 1) return "bg-gray-300"
    if (index === 2) return "bg-amber-300"
    return "bg-white"
  }

  // Sort completions by timestamp
  const sortedCompletions = initialCompletions || (completionsData
    ? [...(Array.isArray(completionsData) ? completionsData : [])].sort((a, b) => {
      const timeA = getCompletionTimestamp(a)
      const timeB = getCompletionTimestamp(b)
      return Number(timeA - timeB)
    })
    : [])

  return (
    <Card className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
      <div className="p-4 sm:p-6">
        {/* Header - Always visible */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            {/* Display crossword name if available */}
            {crosswordName && (
              <h3 className="mb-2 text-lg font-black text-foreground sm:text-xl">
                {crosswordName}
              </h3>
            )}
            {/* Display sponsored by information if available */}
            {crosswordSponsoredBy && (
              <p className="mb-1 text-sm font-bold text-muted-foreground">
                Sponsored by: <span className="font-black text-primary">{crosswordSponsoredBy}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs font-bold sm:text-sm text-muted-foreground">
              <p className="text-sm font-black sm:text-base">
                {crosswordId.substring(0, 12)}..{crosswordId.substring(crosswordId.length - 6)}
              </p>
              {timestamp && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(timestamp)}</span>
                </div>
              )}
            </div>
          </div>
          {/* Grid Section */}
          <div>
            {isGridLoading && !effectiveGridData ? (
              <div className="py-8 text-center">
                <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                <p className="mt-2 text-sm font-bold">Loading grid...</p>
              </div>
            ) : effectiveGridData ? (
              <div className="flex justify-center">
                <ReadOnlyCrosswordGrid clues={effectiveGridData.clues} gridSize={effectiveGridData.gridSize} />
              </div>
            ) : (
              <p className="py-4 text-sm font-bold text-center text-muted-foreground">
                Grid data not available
              </p>
            )}
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-4 border-black bg-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            {isExpanded ? (
              <>
                Hide Details <ChevronUp className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                View Details <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="pt-4 mt-4 space-y-6 border-t-4 border-black">

            {!isCompletionsLoading && (
              <div className="flex items-center gap-1.5 bg-yellow-100 px-2 py-0.5 rounded-full border-2 border-black">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800">
                  Prize Pool: {formatPrizePool(effectivePrizePool)} {isNativeCelo ? " CELO" : "tokens"}
                </span>
              </div>
            )}

            {/* Completions Section */}
            <div>
              <h4 className="mb-3 text-sm font-black uppercase sm:text-base">Completions</h4>
              {isCompletionsLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                  <p className="mt-2 text-sm font-bold">Loading</p>
                </div>
              ) : sortedCompletions.length > 0 ? (
                <>
                  <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {/* Table Header */}
                    <div className="flex items-center justify-between border-b-4 border-black bg-muted/50 p-2 text-xs font-black uppercase sm:p-3">
                      <div className="w-8 text-center">#</div>
                      <div className="flex-1 px-2">User</div>
                    </div>

                    {/* Table Body */}
                    <div>
                      {sortedCompletions.slice(0, visibleCompletions).map((completion: any, index: number) => {
                        const userAddress = getCompletionUser(completion)
                        const rank = index + 1
                        const isWinner = rank <= winnerCount

                        return (
                          <div
                            key={`${userAddress}-${index}`}
                            className={cn(
                              "flex items-center justify-between border-b-2 border-black p-2 last:border-0 sm:p-3",
                              isWinner ? "bg-yellow-50" : "bg-white"
                            )}
                          >
                            {/* Rank */}
                            <div className="flex w-8 flex-col items-center justify-center">
                              <span className={cn(
                                "text-sm font-black",
                                rank === 1 ? "text-yellow-600" :
                                  rank === 2 ? "text-gray-500" :
                                    rank === 3 ? "text-amber-700" : "text-black"
                              )}>
                                {rank}
                              </span>
                              {isWinner && (
                                <Trophy className="mt-0.5 h-3 w-3 text-yellow-500" />
                              )}
                            </div>

                            {/* User */}
                            <div className="flex-1 min-w-0 px-2 text-sm overflow-hidden">
                              {isLegacy ? (
                                <FarcasterUserDisplayLegacy
                                  address={userAddress}
                                  fallbackUsername={
                                    userAddress.substring(0, 6) +
                                    ".." +
                                    userAddress.substring(userAddress.length - 4)
                                  }
                                  size="sm"
                                />
                              ) : (
                                <FarcasterUserDisplay
                                  address={userAddress}
                                  fallbackUsername={
                                    userAddress.substring(0, 6) +
                                    ".." +
                                    userAddress.substring(userAddress.length - 4)
                                  }
                                  size="sm"
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {sortedCompletions.length > visibleCompletions && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleViewMore}
                        variant="outline"
                        className="h-8 border-2 border-black text-xs font-bold uppercase sm:h-10 sm:text-sm"
                      >
                        View More <ChevronDown className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-4 text-sm font-bold text-center text-muted-foreground">
                  No completions yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
