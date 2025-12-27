"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, History, BarChart3, Trophy, ArrowLeft, Coins, Calendar } from "lucide-react";
import { useAccount } from "wagmi";
import { useGetActivePublicCrosswords, useGetPublicCrosswordDetails } from "@/hooks/useContract";
import { CeloNetworkButton } from "@/components/celo-network-button";
import { useCrossword } from "@/contexts/crossword-context";
import { useRouter } from "next/navigation";

interface CrosswordCardProps {
  crosswordId: string;
  onPlay: (crosswordId: string, crosswordData: string) => void;
}

const CrosswordCard = ({ crosswordId, onPlay }: CrosswordCardProps) => {
  const { data: crosswordDetails, isLoading, isError } = useGetPublicCrosswordDetails(crosswordId as `0x${string}`);

  if (isLoading) {
    return (
      <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (isError || !crosswordDetails) {
    return (
      <Card className="p-6 border-4 border-black bg-red-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center text-red-600">Error loading crossword details</div>
      </Card>
    );
  }

  // Extract details from the returned data
  const [name, sponsoredBy, crosswordData, token, totalPrizePool, maxWinners, winnerPercentages, activationTime, endTime, createdAt, isActive, isCompleted, creator] = crosswordDetails;

  // Format prize pool
  const formattedPrize = totalPrizePool ? (Number(totalPrizePool) / 1e18).toFixed(4) : '0';
  const tokenSymbol = token === '0x0000000000000000000000000000000000000000' ? 'CELO' : 'cUSD'; // Simplified for demo

  return (
    <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold truncate">{name || "Untitled Crossword"}</h3>
          {sponsoredBy && (
            <p className="text-sm text-muted-foreground mt-1">Sponsored by: {sponsoredBy}</p>
          )}
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm">
              <Coins className="w-4 h-4 mr-2" />
              <span>Prize Pool: {formattedPrize} {tokenSymbol}</span>
            </div>
            <div className="flex items-center text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              <span>Up to {Number(maxWinners)} winners</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Created: {new Date(Number(createdAt) * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onPlay(crosswordId, crosswordData)}
          className="ml-4 border-2 border-black bg-green-500 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-green-600 active:translate-x-1 active:translate-y-1 hover:shadow-none active:shadow-none"
          disabled={!isActive}
        >
          <Play className="w-4 h-4 mr-2" />
          Play
        </Button>
      </div>
    </Card>
  );
};

export default function ActiveCrosswordsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { refetchCrossword, setActiveCrossword } = useCrossword();
  const { data: activeCrosswords, isLoading, isError, refetch } = useGetActivePublicCrosswords();

  // Refetch active crosswords periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refetch every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const handlePlayCrossword = (crosswordId: string, crosswordData: string) => {
    // Set the crossword in the context and navigate to the game page
    setActiveCrossword(crosswordId, crosswordData);
    router.push(`/?play=true`);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen p-4 bg-background flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">Please connect your wallet to view active crosswords</p>
          <CeloNetworkButton className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Connect Wallet
          </CeloNetworkButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 bg-background sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground sm:text-4xl md:text-5xl">
            Active Crosswords
          </h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
            Play any of these active crosswords and compete for prizes
          </p>
        </div>

        {/* Back Button - Top */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => router.push("/")}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Active Crosswords List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading active crosswords...</p>
            </div>
          ) : isError ? (
            <div className="py-12 text-center">
              <div className="text-red-500">Error loading crosswords. Please try again later.</div>
            </div>
          ) : activeCrosswords && activeCrosswords.length > 0 ? (
            <div className="grid gap-6">
              {activeCrosswords.map((crosswordId: any) => (
                <CrosswordCard
                  key={crosswordId}
                  crosswordId={crosswordId}
                  onPlay={handlePlayCrossword}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-muted-foreground">No active crosswords at the moment. Check back later!</div>
            </div>
          )}
        </div>

        {/* Home Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => router.push("/")}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none"
          >
            <History className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    </main>
  );
}