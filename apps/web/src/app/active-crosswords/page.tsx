"use client"

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, History, BarChart3, Trophy, ArrowLeft, Coins, Calendar, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { useGetActivePublicCrosswords, useGetPublicCrosswordDetails, useUserCompletedCrossword } from "@/hooks/useContract";
import { CeloNetworkButton } from "@/components/celo-network-button";
import { useCrossword } from "@/contexts/crossword-context";
import { useRouter } from "next/navigation";
import { readContract } from 'wagmi/actions';
import { CONTRACTS } from '@/lib/contracts';
import { config } from '@/contexts/frame-wallet-context';
import { useChainId } from "wagmi";

interface CrosswordCardProps {
  crosswordId: string;
  onPlay: (crosswordId: string, crosswordData: string, sponsoredBy?: string) => void;
}

const CrosswordCard = ({ crosswordId, onPlay }: CrosswordCardProps) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: crosswordDetails, isLoading, isError } = useGetPublicCrosswordDetails(crosswordId as `0x${string}`);
  const { data: isUserCompleted } = useUserCompletedCrossword(crosswordId as `0x${string}`, address as `0x${string}`);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(false);

  useEffect(() => {
    async function checkClaimStatus() {
      if (!address || !crosswordId || isCheckingClaim) return;
      
      const claimKey = `claimed_${crosswordId}_${address.toLowerCase()}`;
      if (localStorage.getItem(claimKey) === 'true') {
        setHasClaimed(true);
        return;
      }

      setIsCheckingClaim(true);
      try {
        const contractInfo = (CONTRACTS as any)[chainId]?.['CrosswordPrizes'];
        if (contractInfo?.address) {
          // Simulate claim to check if already claimed
          await readContract(config, {
            address: contractInfo.address as `0x${string}`,
            abi: [{
              "inputs": [{"internalType": "bytes32", "name": "crosswordId", "type": "bytes32"}],
              "name": "claimPrize",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }],
            functionName: 'claimPrize',
            args: [crosswordId as `0x${string}`],
            account: address as `0x${string}`,
          });
        }
      } catch (e: any) {
        if ((e.message || "").toLowerCase().includes("already claimed")) {
          setHasClaimed(true);
          localStorage.setItem(claimKey, 'true');
        }
      } finally {
        setIsCheckingClaim(false);
      }
    }
    checkClaimStatus();
  }, [address, crosswordId, chainId]);

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
  // Note: isGlobalCompleted here refers to global completion (all winners found)
  const [name, sponsoredBy, crosswordData, token, totalPrizePool, maxWinners, winnerPercentages, activationTime, endTime, createdAt, isActive, isGlobalCompleted, creator] = (crosswordDetails as any);

  // If the crossword is already globally completed (all winners found), it moves to History
  if (isGlobalCompleted) return null;

  // We keep showing it in Active even if the current user completed it, 
  // until the whole crossword is finished for everyone (all prizes gone).
  // This allows the user to see it in "Active" and click "Leaderboard" until it's archived.

  // Format prize pool
  const formattedPrize = totalPrizePool ? (Number(totalPrizePool) / 1e18).toFixed(4) : '0';
  const tokenSymbol = token === '0x0000000000000000000000000000000000000000' ? 'CELO' : 'cUSD'; // Simplified for demo

  return (
    <Card className="p-4 sm:p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0 w-full">
          {sponsoredBy && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-yellow-400 border-4 border-black text-sm font-black uppercase tracking-wider transform -rotate-2">
                Sponsored by {sponsoredBy}
              </div>
              {hasClaimed && (
                <div className="px-3 py-1 bg-green-500 border-4 border-black text-white text-sm font-black uppercase tracking-wider transform rotate-2">
                   Prize Claimed
                </div>
              )}
            </div>
          )}
          {!sponsoredBy && hasClaimed && (
            <div className="inline-block mb-2 px-3 py-1 bg-green-500 border-4 border-black text-white text-sm font-black uppercase tracking-wider transform rotate-2">
              Prize Claimed
            </div>
          )}
          <h3 className="text-xl font-black truncate">{name || "Untitled Crossword"}</h3>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm font-bold">
              <Coins className="w-4 h-4 mr-2" />
              <span>Prize Pool: {formattedPrize} {tokenSymbol}</span>
            </div>
            <div className="flex items-center text-sm font-bold">
              <Trophy className="w-4 h-4 mr-2" />
              <span>Up to {Number(maxWinners)} winners</span>
            </div>
            <div className="flex items-center text-sm font-bold text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Created: {new Date(Number(createdAt) * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Button
            onClick={() => onPlay(crosswordId, crosswordData, sponsoredBy)}
            className="w-full sm:w-auto ml-0 border-2 border-black bg-green-500 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-green-600 active:translate-x-1 active:translate-y-1 hover:shadow-none active:shadow-none whitespace-normal h-auto py-3 sm:py-2"
            disabled={!isActive}
          >
            <Play className="w-4 h-4 mr-2 shrink-0" />
            Play
          </Button>
          {(isUserCompleted as unknown as boolean) && (
            <Button
              onClick={() => window.location.href = `/leaderboard?id=${crosswordId}&isPublic=true`}
              className="w-full sm:w-auto ml-0 border-2 border-black bg-blue-500 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-blue-600 active:translate-x-1 active:translate-y-1 hover:shadow-none active:shadow-none whitespace-normal h-auto py-3 sm:py-2"
            >
              <Trophy className="w-4 h-4 mr-2 shrink-0" />
              Leaderboard
            </Button>
          )}
        </div>

      </div>
    </Card>
  );
};

export default function ActiveCrosswordsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { refetchCrossword, setActiveCrossword } = useCrossword();
  const { data: activeCrosswords, isLoading, isFetching, isError, refetch } = useGetActivePublicCrosswords();
  const [visibleCount, setVisibleCount] = useState(10);

  // Check URL for refresh parameter and refetch data if present
  const hasCheckedRefresh = useRef(false);
  useEffect(() => {
    if (hasCheckedRefresh.current) return; // Only run once
    hasCheckedRefresh.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefresh = urlParams.get('refresh');

    if (shouldRefresh) {
      // Remove the refresh parameter from URL without causing navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refetch the active crosswords data
      refetch();
    }
  }, [refetch]); // Include refetch in dependencies

  // Refetch active crosswords periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refetch every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const handlePlayCrossword = (crosswordId: string, crosswordData: string, sponsoredBy?: string) => {
    // Set the crossword in the context and navigate to the game page
    setActiveCrossword(crosswordId, crosswordData, sponsoredBy);
    router.push(`/?play=true&id=${crosswordId}&isPublic=true`);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen p-4 bg-background flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black mb-4 uppercase">Connect Your Wallet</h1>
          <p className="font-bold text-muted-foreground mb-6">Please connect your wallet to view active crosswords</p>
          <CeloNetworkButton className="h-auto w-full border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-4 text-xl">
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
          <p className="mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 inline-block px-3 py-1 border-2 border-yellow-200 rounded-full">
            Note: New crosswords may take a few moments to appear on-chain.
          </p>
        </div>

        {/* Back Button - Top */}
        <div className="flex justify-center flex-wrap gap-4 mb-8">
          <Button
            onClick={() => router.push("/")}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none whitespace-normal h-auto min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
            Back
          </Button>

          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-4 border-black bg-yellow-400 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-yellow-500 hover:shadow-none whitespace-normal h-auto min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 shrink-0 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh List'}
          </Button>
        </div>



        {/* Active Crosswords List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
              <p className="mt-4 font-bold text-muted-foreground">Loading active crosswords...</p>
            </div>
          ) : isError ? (
            <div className="py-12 text-center">
              <div className="font-bold text-red-500">Error loading crosswords. Please try again later.</div>
            </div>
          ) : activeCrosswords && (activeCrosswords as any[]).length > 0 ? (
            <div className="grid gap-6">
              {[...(activeCrosswords as any[])].reverse().slice(0, visibleCount).map((crosswordId: any) => (
                <CrosswordCard
                  key={crosswordId}
                  crosswordId={crosswordId}
                  onPlay={handlePlayCrossword}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="font-bold text-muted-foreground">No active crosswords at the moment. Check back later!</div>
            </div>
          )}
        </div>

        {/* See More Button */}
        {activeCrosswords && visibleCount < (activeCrosswords as any[]).length && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="border-4 border-black bg-purple-500 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-purple-600 hover:shadow-none"
            >
              See More
            </Button>
          </div>
        )}

        {/* Home Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => router.push("/")}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none whitespace-normal h-auto min-h-[44px]"
          >
            <History className="w-4 h-4 mr-2 shrink-0" />
            Return to Home
          </Button>
        </div>
      </div>
    </main>
  );
}