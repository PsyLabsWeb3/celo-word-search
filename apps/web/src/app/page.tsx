"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import CrosswordGame from "@/components/crossword-game"
import { Button } from "@/components/ui/button"
import { AlertCircle, Wallet, Play, History, BarChart3, Trophy, ArrowRight, Plus, Loader2, ArrowLeft } from "lucide-react"
import { useCrossword } from "@/contexts/crossword-context";
import { useCeloNetworkValidation } from "@/hooks/useCeloNetworkValidation";
import { CeloNetworkButton } from "@/components/celo-network-button";
import { useUserCompletedCrossword, useGetCrosswordCompletions } from "@/hooks/useContract";

const AlphabetAnimation = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  const [currentLetter, setCurrentLetter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLetter((prevLetter) => (prevLetter + 1) % alphabet.length);
    }, 100); // Change letter every 100ms

    return () => clearInterval(interval);
  }, [alphabet.length]);

  return (
    <div className="flex items-center justify-center w-12 h-12 mx-auto text-4xl font-black text-foreground">
      {alphabet[currentLetter]}
    </div>
  );
};

function PageContent() {
  const [walletConnected, setWalletConnected] = useState(false)

  // We no longer check for saved user progress in localStorage - all data is on-chain
  const hasSavedUserProgress = false;

  // We no longer check for saved crossword data in localStorage - all data is on-chain
  const hasSavedCrosswordData = false;

  // No saved crossword to continue since we're using on-chain only
  const hasSavedCrossword = false;

  const [gameStarted, setGameStarted] = useState(false)
  // Estado para controlar si se debe ignorar los datos guardados
  const [ignoreSavedData, setIgnoreSavedData] = useState(false)
  const [alreadyCompletedLocal, setAlreadyCompleted] = useState(false)

  // Use actual wallet connection state
  const { isConnected, address } = useAccount();
  const { refetchCrossword, currentCrossword } = useCrossword();
  const searchParams = useSearchParams();
  
  // Initialize loading state immediately if play=true is present
  const [isRedirecting, setIsRedirecting] = useState(() => {
    return searchParams?.get('play') === 'true';
  });

  // Auto-start if play=true is in URL and we have a crossword
  useEffect(() => {
    if (searchParams?.get('play') === 'true') {
      if (currentCrossword?.id) {
        // Add a small artificial delay to make the transition smoother (min 800ms)
        const timer = setTimeout(() => {
          setGameStarted(true);
          setIsRedirecting(false);
          // Clean up the URL to remove the parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 800);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsRedirecting(false);
    }
  }, [currentCrossword, searchParams]);

  // Check completions for the current crossword to see if user has completed it
  const { completions: onChainCompletions, isLoading: isCompletionsLoading } = useGetCrosswordCompletions(
    currentCrossword?.id as `0x${string}` || `0x0000000000000000000000000000000000000000000000000000000000000000`
  );

  // Helper functions to handle both tuple-style and object-style completion data (same as in leaderboard)
  const getCompletionUser = useCallback((completion: any): string => {
    return completion.user ?? completion[0];
  }, []);

  // Check if user is in the completions list
  const userHasCompletedCrossword = useMemo(() => {
    if (!isConnected || !address || !Array.isArray(onChainCompletions) || onChainCompletions.length === 0) {
      return false;
    }

    // Normalize addresses for comparison (handle potential case differences)
    const normalizedAddress = address.toLowerCase();

    return onChainCompletions.some(completion => {
      const completionUser = getCompletionUser(completion).toLowerCase();
      return completionUser === normalizedAddress;
    });
  }, [isConnected, address, onChainCompletions]);

  // For strict requirement (only after completing current crossword), check if user is in completions
  const alreadyCompleted = (currentCrossword?.id && userHasCompletedCrossword) || alreadyCompletedLocal;


  // Validate Celo network connection
  const {
    isOnCeloNetwork,
    currentChainName,
    requiredNetworks
  } = useCeloNetworkValidation();

  // Forzar refresco del crucigrama del contrato cuando se monta la página
  // Solo si no tenemos ya uno activo (por ejemplo, seleccionado manualmente desde active-crosswords)
  useEffect(() => {
    if (!currentCrossword?.id) {
      refetchCrossword();
    }
  }, [currentCrossword?.id, refetchCrossword]);

  const handleStartNewGame = () => {
    // Establecer que NO se debe ignorar los datos guardados (queremos el crucigrama actual)
    setIgnoreSavedData(false);
    setGameStarted(true)
  }

  const handleContinueGame = () => {
    // No ignorar los datos guardados al continuar
    setIgnoreSavedData(false);
    // Continuar con el crucigrama guardado
    setGameStarted(true)
  }

  if (gameStarted) {
    return (
      <>
        <main className="min-h-screen p-4 bg-[#8CE4FF] sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 text-center md:mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                DeFi Word Search
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Select a word in the grid to find it.
              </p>
            </div>
            <CrosswordGame
              ignoreSavedData={ignoreSavedData}
              onCrosswordCompleted={() => setAlreadyCompleted(true)}
            />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#8CE4FF]/60 backdrop-blur-md">
          <div className=" ml-2 mr-2 border-4 border-black bg-white p-12 text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-black uppercase">Loading Word Search</h2>
            <p className="text-muted-foreground font-bold">Bringing the board to life...</p>
          </div>
        </div>
      )}
      <main className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-[#8CE4FF]">
        {/* Animated crossword grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid w-full h-full grid-cols-12 gap-2 p-8 md:grid-cols-20">
            {Array.from({ length: 240 }).map((_, i) => {
              // Generate a random letter (A-Z)
              const randomLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
              return (
                <div
                  key={i}
                  className="bg-white border-4 border-black animate-pulse flex items-center justify-center font-black text-black"
                  style={{
                    animationDelay: `${(i * 50) % 3000}ms`,
                    animationDuration: "3s",
                  }}
                >
                  {randomLetter}
                </div>
              );
            })}
          </div>
        </div>



        {/* Main content */}
        <div className="relative z-10 w-full max-w-6xl text-center px-4">
          <div className="mb-8 space-y-4">
         

            <h1 className="text-4xl font-black leading-tight uppercase text-balance text-foreground sm:text-5xl md:text-7xl">
              Onchain Word Search
            </h1>
                  <h2 className="text-2xl font-black leading-tight uppercase text-balance text-foreground sm:text-5xl md:text-7xl">
              (Prototype)
            </h2>

            <p className="max-w-lg mx-auto text-lg font-bold text-pretty text-muted-foreground md:text-xl">
              Find words in the grid and compete for amazing rewards. The winners take it all!
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 w-full mx-auto mt-12 items-start">
            {/* Sample Word Search Grid */}
            <div className="w-full lg:w-2/3">
              <div className="border-4 border-black bg-orange-50 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
                <div className="grid grid-cols-10 gap-2 sm:gap-3 mx-auto">
                  {Array.from({ length: 100 }).map((_, index) => {
                    const row = Math.floor(index / 10);
                    const col = index % 10;
                    // Create a sample grid with some words placed
                    let letter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);

                    // Place words in the grid
                    // BLOCKCHAIN: row 0, cols 0-9
                    if (row === 0 && col < 10) {
                      const wordLetters = ['B', 'L', 'O', 'C', 'K', 'C', 'H', 'A', 'I', 'N'];
                      letter = wordLetters[col];
                    }
                    // CELO: row 2, cols 2-5 (horizontal)
                    else if (row === 2 && col >= 2 && col <= 5) {
                      const wordLetters = ['C', 'E', 'L', 'O'];
                      const wordCol = col - 2;
                      letter = wordLetters[wordCol];
                    }
                    // CRYPTO: diagonal from row 4, col 1
                    else if (row >= 4 && row <= 9 && col >= 1 && col <= 6 && row - 4 === col - 1) {
                      const wordLetters = ['C', 'R', 'Y', 'P', 'T', 'O'];
                      const wordIndex = row - 4;
                      letter = wordLetters[wordIndex];
                    }
                    // STABLE: row 6, cols 4-9
                    else if (row === 6 && col >= 4 && col <= 9) {
                      const wordLetters = ['S', 'T', 'A', 'B', 'L', 'E'];
                      const wordCol = col - 4;
                      letter = wordLetters[wordCol];
                    }
                    // WEB3: row 8, cols 0-3
                    else if (row === 8 && col >= 0 && col <= 3) {
                      const wordLetters = ['W', 'E', 'B', '3'];
                      const wordCol = col;
                      letter = wordLetters[wordCol];
                    }

                    return (
                      <div
                        key={index}
                        className="bg-white border-2 border-black aspect-square flex items-center justify-center font-black text-xs sm:text-sm md:text-base text-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-200 transition-all duration-100 hover:-translate-y-0.5 hover:-translate-x-0.5"
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Words List */}
            <div className="w-full lg:w-1/3 h-full">
              <div className="border-4 border-black bg-orange-50 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col h-full min-h-[400px]">
                <h2 className="text-xl font-black mb-4 text-center">WORDS TO FIND</h2>
                <ul className="flex flex-wrap lg:flex-col gap-2 justify-center lg:justify-start">
                  {["BLOCKCHAIN", "CELO", "CRYPTO", "STABLE", "WEB3"].map((word, index) => (
                    <li
                      key={index}
                      className="font-black text-xs sm:text-sm md:text-base px-4 py-2 border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center uppercase tracking-wider"
                    >
                      {word}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 md:mt-6">
                  <Link href="/word-search" passHref className="w-full">
                    <Button
                      className="h-auto min-h-12 w-full border-4 border-black bg-green-500 p-3 text-base sm:text-lg font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 hover:bg-green-600 active:bg-green-600 hover:shadow-none active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2 whitespace-normal leading-tight"
                    >
                      <Play className="w-6 h-6 shrink-0" />
                      <span>Play Full Game</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>


        {/* Features */}
          <div className="grid gap-4 mt-8 sm:grid-cols-3">
            {[
              {
                emoji: (
                  <div className="flex items-center justify-center">
                    <Image
                      src="/celo-logo-new.png"
                      alt="Celo Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                ),
                text: "Powered by CELO"
              },
              {
                emoji: (
                  <div className="flex items-center justify-center h-12">
                    <Image
                      src="/psylabs-logo.webp"
                      alt="Psylabs Logo"
                      width={120}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                ),
                text: "Built by"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 hover:bg-secondary active:bg-secondary hover:shadow-none active:shadow-none"
              >
                <div className="text-3xl flex justify-center">{feature.emoji}</div>
                <p className="mt-2 text-sm font-black uppercase text-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
        <div className="border-4 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-black uppercase">Loading...</h2>
        </div>
      </div>
    }>
      <PageContent />
    </Suspense>
  )
}
