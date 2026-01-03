"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, AlertCircle, Upload, Settings, ArrowLeft, History } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { 
  useCreatePublicCrossword, 
  useCreatePublicCrosswordWithPrizePool, 
  useCreatePublicCrosswordWithNativeCELOPrizePool
} from "@/hooks/useContract";
import { CeloNetworkButton } from "@/components/celo-network-button";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";

interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

interface CrosswordData {
  gridSize: { rows: number; cols: number };
  clues: Clue[];
  name?: string;
  sponsoredBy?: string;
}

export default function CreateCrosswordPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const { createPublicCrossword, isLoading: isCreating, isSuccess, isError, error } = useCreatePublicCrossword();
  const { createPublicCrosswordWithPrizePool, isLoading: isCreatingWithTokenPrize, isSuccess: isSuccessWithToken, isError: isErrorWithToken, error: errorWithToken } = useCreatePublicCrosswordWithPrizePool();
  const { createPublicCrosswordWithNativeCELOPrizePool, isLoading: isCreatingWithCELOPrize, isSuccess: isSuccessWithCELO, isError: isErrorWithCELO, error: errorWithCELO } = useCreatePublicCrosswordWithNativeCELOPrizePool();

  const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 });
  const [clues, setClues] = useState<Clue[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [newClue, setNewClue] = useState({ clue: "", answer: "", direction: "across" as "across" | "down" });
  
  const [crosswordName, setCrosswordName] = useState<string>("");
  const [sponsoredBy, setSponsoredBy] = useState<string>("");
  
  const [prizePoolAmount, setPrizePoolAmount] = useState<string>("");
  const [prizePoolToken, setPrizePoolToken] = useState<string>("0x0000000000000000000000000000000000000000"); // CELO only
  const [winnerPercentages, setWinnerPercentages] = useState<string[]>(["5000", "3000", "2000"]); // Default: 50%, 30%, 20%
  const [endTime, setEndTime] = useState<string>(""); // Unix timestamp
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());
  const [proportionalPrizePool, setProportionalPrizePool] = useState<boolean>(false);

  // Redirect to active crosswords after successful creation
  useEffect(() => {
    console.log("Checking success states:", { isSuccess, isSuccessWithToken, isSuccessWithCELO });
    if (isSuccess || isSuccessWithToken || isSuccessWithCELO) {
      console.log("Redirecting to active crosswords - success detected");
      toast.success("Crossword created successfully!");
      // Add a small delay to ensure transaction is fully processed before redirecting
      setTimeout(() => {
        // Redirect with a query parameter to indicate refresh is needed
        router.push("/active-crosswords?refresh=1");
      }, 2000); // 2 seconds delay
    }
  }, [isSuccess, isSuccessWithToken, isSuccessWithCELO, router]);

  // Check for errors in contract calls
  useEffect(() => {
    console.log("Checking error states:", {
      error: error || errorWithToken || errorWithCELO,
      isError: isError || isErrorWithToken || isErrorWithCELO
    });
    if (isError || isErrorWithToken || isErrorWithCELO) {
      console.error("Contract error detected:", { error, errorWithToken, errorWithCELO });
      toast.error("Contract error occurred. Please check console for details.");
    }
  }, [isError, isErrorWithToken, isErrorWithCELO, error, errorWithToken, errorWithCELO]);

  // Generate grid preview based on clues
  const gridPreview = Array.from({ length: gridSize.rows }, (_, rowIndex) =>
    Array.from({ length: gridSize.cols }, (_, colIndex) => {
      let cellLetter = null;

      // Check if this cell is part of any clue
      for (const clue of clues) {
        if (clue.direction === "across" &&
            rowIndex === clue.row &&
            colIndex >= clue.col &&
            colIndex < clue.col + clue.answer.length) {
          const charIndex = colIndex - clue.col;
          cellLetter = clue.answer[charIndex] || "";
          break; // Found the letter for this cell
        }
        if (clue.direction === "down" &&
            colIndex === clue.col &&
            rowIndex >= clue.row &&
            rowIndex < clue.row + clue.answer.length) {
          const charIndex = rowIndex - clue.row;
          cellLetter = clue.answer[charIndex] || "";
          break; // Found the letter for this cell
        }
      }

      // If no clue covers this cell, return null (black cell)
      return cellLetter;
    })
  );

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleAddWord = () => {
    if (!selectedCell || !newClue.answer || !newClue.clue) {
      toast.error("Please select a cell and fill in the answer and clue");
      return;
    }

    const answer = newClue.answer.toUpperCase();
    const newClueObj: Clue = {
      number: clues.length + 1,
      clue: newClue.clue,
      answer,
      row: selectedCell.row,
      col: selectedCell.col,
      direction: newClue.direction
    };

    // Check for conflicts before adding
    const newConflicts = new Set<string>();
    const isOverlapping = checkForOverlaps(newClueObj, clues, newConflicts);

    if (isOverlapping && newConflicts.size > 0) {
      toast.error("Word placement conflicts with existing words. Please adjust.");
      setConflictCells(newConflicts);
      return;
    }

    const newClues = [...clues, newClueObj];
    setClues(newClues);

    setNewClue({ clue: "", answer: "", direction: "across" });
    setConflictCells(new Set()); // Clear conflicts after successful addition
  };

  const checkForOverlaps = (newClue: Clue, existingClues: Clue[], conflicts: Set<string>) => {
    let hasConflict = false;

    // Calculate all positions that the new clue will occupy
    const newPositions = [];
    if (newClue.direction === "across") {
      for (let i = 0; i < newClue.answer.length; i++) {
        newPositions.push({ row: newClue.row, col: newClue.col + i });
      }
    } else {
      for (let i = 0; i < newClue.answer.length; i++) {
        newPositions.push({ row: newClue.row + i, col: newClue.col });
      }
    }

    // Check each position against existing clues
    for (const pos of newPositions) {
      const posKey = `${pos.row}-${pos.col}`;

      // Check if this position is already part of another clue
      for (const existingClue of existingClues) {
        let isPartOfExisting = false;

        // Check if this position is part of the existing clue
        if (existingClue.direction === "across") {
          if (pos.row === existingClue.row &&
              pos.col >= existingClue.col &&
              pos.col < existingClue.col + existingClue.answer.length) {
            isPartOfExisting = true;
          }
        } else {
          if (pos.col === existingClue.col &&
              pos.row >= existingClue.row &&
              pos.row < existingClue.row + existingClue.answer.length) {
            isPartOfExisting = true;
          }
        }

        if (isPartOfExisting) {
          // Find the character at this position in both clues
          let newChar = '';
          let existingChar = '';

          if (newClue.direction === "across") {
            const charIndex = pos.col - newClue.col;
            if (charIndex >= 0 && charIndex < newClue.answer.length) {
              newChar = newClue.answer[charIndex];
            }
          } else {
            const charIndex = pos.row - newClue.row;
            if (charIndex >= 0 && charIndex < newClue.answer.length) {
              newChar = newClue.answer[charIndex];
            }
          }

          if (existingClue.direction === "across") {
            const charIndex = pos.col - existingClue.col;
            if (charIndex >= 0 && charIndex < existingClue.answer.length) {
              existingChar = existingClue.answer[charIndex];
            }
          } else {
            const charIndex = pos.row - existingClue.row;
            if (charIndex >= 0 && charIndex < existingClue.answer.length) {
              existingChar = existingClue.answer[charIndex];
            }
          }

          // If characters don't match, it's a conflict
          if (newChar && existingChar && newChar !== existingChar) {
            conflicts.add(posKey);
            hasConflict = true;
          }
        }
      }
    }

    return hasConflict;
  };

  const removeClue = (index: number) => {
    const newClues = [...clues];
    newClues.splice(index, 1);
    // Update clue numbers after removal
    const updatedClues = newClues.map((clue, idx) => ({
      ...clue,
      number: idx + 1
    }));
    setClues(updatedClues);
  };

  const handleSave = async () => {
    console.log("handleSave called - starting crossword creation");
    console.log("Wallet connection status:", { address, isConnected });

    if (!crosswordName) {
      toast.error("Please enter a name for your crossword");
      return;
    }

    if (clues.length === 0) {
      toast.error("Please add at least one word to your crossword");
      return;
    }

    // Validate that all clues fit within the grid
    for (const clue of clues) {
      if (clue.direction === "across" && clue.col + clue.answer.length > gridSize.cols) {
        toast.error(`Clue "${clue.answer}" extends beyond the grid boundaries`);
        return;
      }
      if (clue.direction === "down" && clue.row + clue.answer.length > gridSize.rows) {
        toast.error(`Clue "${clue.answer}" extends beyond the grid boundaries`);
        return;
      }
    }

    // Use the winnerPercentages from state, which are already calculated proportionally
    // if the checkbox is enabled. This ensures the number of winners matches
    // what the user has defined in the list.
    const finalWinnerPercentages = [...winnerPercentages];

    const crosswordData: CrosswordData = {
      gridSize,
      clues,
      name: crosswordName,
      sponsoredBy
    };

    console.log("Crossword data prepared:", crosswordData);

    try {
      console.log("Starting crossword creation...");
      console.log("prizePoolAmount:", prizePoolAmount);
      console.log("crosswordData:", crosswordData);
      console.log("finalWinnerPercentages:", finalWinnerPercentages);
      console.log("Contract functions available:", {
        createPublicCrossword: typeof createPublicCrossword,
        createPublicCrosswordWithNativeCELOPrizePool: typeof createPublicCrosswordWithNativeCELOPrizePool,
        isCreating, isCreatingWithCELOPrize,
        isError, isErrorWithCELO, error, errorWithCELO
      });

      // Generate a unique crossword ID (32 bytes = 64 hex characters)
      // Using a more reliable method for generating random hex string
      const randomBytes = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      const crosswordId = `0x${randomBytes}` as `0x${string}`;

      // Format crossword data as a JSON string for the contract
      const crosswordDataString = JSON.stringify({
        gridSize: crosswordData.gridSize,
        clues: crosswordData.clues
      });

      // Determine which creation function to use based on prize pool
      if (prizePoolAmount && parseFloat(prizePoolAmount) > 0) {
        console.log("Creating with native CELO prize pool");
        // Convert prize pool amount to proper format (CELO has 18 decimals)
        // Use parseEther to avoid floating point precision issues
        const cleanAmount = prizePoolAmount.trim();
        const prizePoolInWei = parseEther(cleanAmount);
        
        // Ensure all numeric parameters are BigInts to match ABI uint256
        const maxWinnersBigInt = BigInt(finalWinnerPercentages.length);
        const winnerPercentagesBigInt = finalWinnerPercentages.map(p => BigInt(p));
        const endTimeBigInt = BigInt(Math.floor(Date.now() / 1000) + 86400);

        console.log("Calling createPublicCrosswordWithNativeCELOPrizePool with params:", JSON.stringify({
          crosswordId,
          name: crosswordData.name || "",
          crosswordData: crosswordDataString,
          sponsoredBy: crosswordData.sponsoredBy || "",
          maxWinners: maxWinnersBigInt.toString(),
          prizePoolInWei: prizePoolInWei.toString(),
          winnerPercentages: winnerPercentagesBigInt.map(String),
          endTime: endTimeBigInt.toString()
        }, null, 2));

        // Only CELO is supported now
        // For native CELO prize pool, we need to pass the prize amount as the transaction value
        const result = await createPublicCrosswordWithNativeCELOPrizePool(
          [
            crosswordId,
            crosswordData.name || "",
            crosswordDataString,
            crosswordData.sponsoredBy || "",
            maxWinnersBigInt, // max winners as BigInt
            prizePoolInWei,   // prize pool amount as BigInt
            winnerPercentagesBigInt, // winner percentages as BigInt[]
            endTimeBigInt     // end time as BigInt
          ],
          prizePoolInWei // Pass prize amount as transaction value (BigInt)
        );
        console.log("createPublicCrosswordWithNativeCELOPrizePool result:", result);
      } else {
        console.log("Creating without prize pool");
        console.log("Calling createPublicCrossword with params:", {
          crosswordId,
          name: crosswordData.name || "",
          crosswordData: crosswordDataString,
          sponsoredBy: crosswordData.sponsoredBy || ""
        });
        // For createPublicCrossword, we need to pass the correct parameters as an array
        const result = await createPublicCrossword([
          crosswordId,
          crosswordData.name || "",
          crosswordDataString,
          crosswordData.sponsoredBy || ""
        ]);
        console.log("createPublicCrossword result:", result);
      }

      console.log("Crossword creation initiated successfully");
      toast.success("Crossword creation initiated! Waiting for transaction confirmation...");
    } catch (error) {
      console.error("Error creating crossword:", error);
      toast.error("Failed to create crossword. Please try again.");
    }
  };

  const isAnyLoading = isCreating || isCreatingWithTokenPrize || isCreatingWithCELOPrize;

  // Log loading states for debugging
  useEffect(() => {
    console.log("Loading states:", {
      isCreating,
      isCreatingWithTokenPrize,
      isCreatingWithCELOPrize,
      isAnyLoading
    });
  }, [isCreating, isCreatingWithTokenPrize, isCreatingWithCELOPrize, isAnyLoading]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-2xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-bold">Connect Wallet</h2>
          <p className="mb-6 text-lg">Please connect your wallet to create a crossword.</p>
          <div className="flex justify-center">
            <CeloNetworkButton className="h-auto w-64 border-4 border-black bg-[#27F52A] px-6 py-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Connect Wallet
            </CeloNetworkButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 bg-background sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center md:mb-8">
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground sm:text-4xl md:text-5xl">
            Create Your Crossword
          </h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
            Design your own crossword and add a prize pool
          </p>
        </div>
        
        {/* Back Button - Top */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => router.push("/")}
            className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none whitespace-normal h-auto min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
            Back
          </Button>
        </div>

        <div className="mb-8 w-full max-w-full">
          <Card className="border-4 border-black bg-card p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-full">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 mr-3 text-foreground" />
              <h2 className="text-2xl font-black uppercase text-foreground">Configuration</h2>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
              <div className="flex-1 min-w-0">
                <Card className="border-4 border-black bg-popover p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full w-full max-w-full">
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-bold">Name *</Label>
                      <Input
                        placeholder="My Crossword"
                        value={crosswordName}
                        onChange={(e) => setCrosswordName(e.target.value)}
                        className="border-4 border-black font-bold"
                      />
                    </div>
                    <div>
                      <Label className="font-bold">Sponsored By *</Label>
                      <Input
                        placeholder="By Psylabs"
                        value={sponsoredBy}
                        onChange={(e) => setSponsoredBy(e.target.value)}
                        className="border-4 border-black font-bold"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex-1 min-w-0">
                <Card className="border-4 border-black bg-popover p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">Prize Pool</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="proportional-prize-pool"
                        checked={proportionalPrizePool}
                        onChange={(e) => {
                          setProportionalPrizePool(e.target.checked);
                          if (e.target.checked) {
                            // Calculate proportional winner percentages based on number of winners
                            const numWinners = winnerPercentages.length > 0 ? winnerPercentages.length : 1;
                            const basePercentage = Math.floor(10000 / numWinners); // 10000 basis points = 100%

                            // Create equal percentages for all winners, with any remainder going to first place
                            let percentages = Array(numWinners).fill(basePercentage);
                            const totalAssigned = basePercentage * numWinners;
                            const remainder = 10000 - totalAssigned;
                            if (remainder > 0 && percentages.length > 0) {
                              percentages[0] += remainder;
                            }

                            setWinnerPercentages(percentages.map(p => p.toString()));
                          }
                        }}
                        className="w-5 h-5 border-2 border-black accent-primary"
                      />
                      <Label htmlFor="proportional-prize-pool" className="font-bold cursor-pointer">
                        Calculate winner percentages proportionally
                      </Label>
                    </div>

                    <div className="flex gap-2">
                       <div className="flex-1">
                          <Label className="font-bold">Amount</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={prizePoolAmount}
                            onChange={(e) => {
                              // Only allow numbers and decimal points
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value) || value === '') {
                                setPrizePoolAmount(value);
                              }
                            }}
                            className="border-4 border-black font-bold"
                          />
                       </div>
                       <div>
                          <Label className="font-bold">Token</Label>
                          <select
                              value={prizePoolToken}
                              onChange={(e) => setPrizePoolToken(e.target.value)}
                              className="w-full h-10 px-3 py-2 border-4 border-black font-bold bg-white"
                            >
                            <option value="0x0000000000000000000000000000000000000000">CELO</option>
                          </select>
                       </div>
                    </div>
                    <div>
                      <Label className="font-bold">Winner Percentages (basis points, 100 = 1%)</Label>
                      {winnerPercentages.map((percentage, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Input
                            type="number"
                            value={percentage}
                            onChange={(e) => {
                              // Only allow numbers
                              const value = e.target.value;
                              if (/^\d*$/.test(value) || value === '') {
                                const newPercentages = [...winnerPercentages];
                                newPercentages[index] = value;
                                setWinnerPercentages(newPercentages);
                              }
                            }}
                            disabled={proportionalPrizePool}
                            className={`border-4 border-black font-bold flex-grow ${proportionalPrizePool ? 'bg-gray-100' : ''}`}
                            placeholder={`Winner ${index + 1} %`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newPercentages = winnerPercentages.filter((_, i) => i !== index);
                              if (proportionalPrizePool) {
                                // If proportional is enabled, recalculate percentages based on new number of winners
                                const numWinners = newPercentages.length;
                                if (numWinners > 0) {
                                  const basePercentage = Math.floor(10000 / numWinners); // 10000 basis points = 100%

                                  // Create equal percentages for all winners, with any remainder going to first place
                                  let percentages = Array(numWinners).fill(basePercentage);
                                  const totalAssigned = basePercentage * numWinners;
                                  const remainder = 10000 - totalAssigned;
                                  if (remainder > 0 && percentages.length > 0) {
                                    percentages[0] += remainder;
                                  }

                                  setWinnerPercentages(percentages.map(p => p.toString()));
                                } else {
                                  // If no winners left, reset to default
                                  setWinnerPercentages(["5000", "3000", "2000"]);
                                }
                              } else {
                                setWinnerPercentages(newPercentages);
                              }
                            }}
                            disabled={proportionalPrizePool}
                            className={`border-4 border-black ${proportionalPrizePool ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          onClick={() => {
                            const newWinnerPercentages = [...winnerPercentages, "0"];
                            if (proportionalPrizePool) {
                              // If proportional is enabled, recalculate percentages based on new number of winners
                              const numWinners = newWinnerPercentages.length;
                              const basePercentage = Math.floor(10000 / numWinners); // 10000 basis points = 100%

                              // Create equal percentages for all winners, with any remainder going to first place
                              let percentages = Array(numWinners).fill(basePercentage);
                              const totalAssigned = basePercentage * numWinners;
                              const remainder = 10000 - totalAssigned;
                              if (remainder > 0 && percentages.length > 0) {
                                percentages[0] += remainder;
                              }

                              setWinnerPercentages(percentages.map(p => p.toString()));
                            } else {
                              setWinnerPercentages(newWinnerPercentages);
                            }
                          }}
                          className="flex-1 border-4 border-black bg-green-500 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Winner
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-8 min-w-0 w-full">
          <div className="min-w-0 w-full max-w-full">
            <Card className="border-4 border-black bg-card p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full w-full max-w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-black uppercase">
                    Preview {conflictCells.size > 0 && <span className="text-destructive">({conflictCells.size} conflicts)</span>}
                  </h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold whitespace-nowrap">Rows:</Label>
                      <Input
                        type="number"
                        value={gridSize.rows}
                        onChange={(e) => {
                          // Only allow numbers between 5 and 10
                          const value = e.target.value;
                          if (/^\d*$/.test(value) || value === '') {
                            const numValue = value === '' ? 5 : Math.min(Math.max(Number.parseInt(value) || 5, 5), 10);
                            setGridSize({ ...gridSize, rows: numValue });
                          }
                        }}
                        min={5}
                        max={10}
                        className="w-16 h-8 border-2 border-black font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold whitespace-nowrap">Cols:</Label>
                      <Input
                        type="number"
                        value={gridSize.cols}
                        onChange={(e) => {
                          // Only allow numbers between 5 and 10
                          const value = e.target.value;
                          if (/^\d*$/.test(value) || value === '') {
                            const numValue = value === '' ? 5 : Math.min(Math.max(Number.parseInt(value) || 5, 5), 10);
                            setGridSize({ ...gridSize, cols: numValue });
                          }
                        }}
                        min={5}
                        max={10}
                        className="w-16 h-8 border-2 border-black font-bold"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center overflow-auto p-4">
                  <div className="inline-block border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)` }}>
                      {gridPreview.map((row, rowIdx) =>
                        row.map((cell, colIdx) => {
                          const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                          const hasConflict = conflictCells.has(`${rowIdx}-${colIdx}`)
                          const cellNumber = clues.find(c => c.row === rowIdx && c.col === colIdx)?.number

                          // Make cells smaller when grid approaches max size (10x10) to prevent scrolling on some devices
                          const isLargeGrid = gridSize.rows >= 8 || gridSize.cols >= 8;
                          const cellSize = isLargeGrid ? "h-7 w-7 text-[9px]" : "h-8 w-8 sm:h-10 sm:w-10 text-[10px] sm:text-xs";
                          const numberSize = isLargeGrid ? "text-[5px]" : "text-[6px] sm:text-[8px]";

                          return (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => handleCellClick(rowIdx, colIdx)}
                              className={`relative flex cursor-pointer items-center justify-center border-2 border-black font-black ${
                                cell === null ? "bg-gray-800" : "bg-white"
                              } ${isSelected ? "ring-4 ring-primary" : ""} ${hasConflict ? "bg-destructive text-destructive-foreground" : ""} ${cellSize}`}
                            >
                              {cellNumber && (
                                <span
                                  className={`absolute left-0.5 top-0.5 text-primary ${numberSize}`}
                                  style={{
                                    fontSize: cellNumber.toString().length > 1 ? '6px' : '',
                                    lineHeight: '1',
                                    minWidth: '10px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {cellNumber}
                                </span>
                              )}
                              {cell}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
            </Card>
          </div>

          <div className="space-y-6 min-w-0 max-w-full">
            <Card className="border-4 border-black bg-popover p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-full">
              <h2 className="mb-4 text-xl font-black uppercase">Add Word</h2>
               {selectedCell && (
                  <div className="p-2 mb-3 font-bold text-center border-2 rounded border-primary bg-primary/10">
                    R{selectedCell.row + 1}, C{selectedCell.col + 1}
                  </div>
                )}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setNewClue({ ...newClue, direction: "across" })}
                    variant={newClue.direction === "across" ? "default" : "outline"}
                    className="flex-1 border-2 border-black font-black"
                  >
                    Across
                  </Button>
                  <Button
                    onClick={() => setNewClue({ ...newClue, direction: "down" })}
                    variant={newClue.direction === "down" ? "default" : "outline"}
                    className="flex-1 border-2 border-black font-black"
                  >
                    Down
                  </Button>
                </div>
                <Input
                  value={newClue.answer}
                  onChange={(e) => {
                    // Only allow letters (A-Z) and convert to uppercase
                    const value = e.target.value.toUpperCase();
                    if (/^[A-Z]*$/.test(value) || value === '') {
                      setNewClue({ ...newClue, answer: value });
                    }
                  }}
                  className="font-bold border-2 border-black"
                  placeholder="ANSWER"
                />
                <Textarea
                  value={newClue.clue}
                  onChange={(e) => setNewClue({ ...newClue, clue: e.target.value })}
                  className="font-bold border-2 border-black"
                  placeholder="The clue goes here..."
                />
                <Button
                  onClick={handleAddWord}
                  className="w-full border-4 border-black bg-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
               <div className="mt-6 pt-4 border-t-2 border-black">
                 <Button
                  onClick={() => {
                    console.log("Create Crossword button clicked, loading state:", isAnyLoading);
                    handleSave();
                  }}
                  disabled={isAnyLoading}
                  className="w-full border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isAnyLoading ? "Creating..." : "Create Crossword"}
                </Button>
               </div>
            </Card>
          </div>
        </div>

        {clues.length > 0 && (
          <Card className="mt-8 border-4 border-black bg-popover p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-full">
            <h2 className="mb-4 text-xl font-black uppercase">Added Words ({clues.length})</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {clues.map((clue, index) => (
                <div key={index} className="flex items-center justify-between border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <div className="font-black text-primary">#{clue.number} {clue.answer} ({clue.direction})</div>
                    <div className="text-xs font-bold text-muted-foreground">{clue.clue}</div>
                  </div>
                  <Button onClick={() => removeClue(index)} variant="outline" size="sm" className="border-2 border-black">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
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