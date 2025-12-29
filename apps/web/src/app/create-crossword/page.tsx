"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, AlertCircle, Upload, Settings } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { 
  useCreatePublicCrossword, 
  useCreatePublicCrosswordWithPrizePool, 
  useCreatePublicCrosswordWithNativeCELOPrizePool
} from "@/hooks/useContract";
import { CeloNetworkButton } from "@/components/celo-network-button";
import { useRouter } from "next/navigation";

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
  
  const { createPublicCrossword, isLoading: isCreating, isSuccess } = useCreatePublicCrossword();
  const { createPublicCrosswordWithPrizePool, isLoading: isCreatingWithTokenPrize, isSuccess: isSuccessWithToken } = useCreatePublicCrosswordWithPrizePool();
  const { createPublicCrosswordWithNativeCELOPrizePool, isLoading: isCreatingWithCELOPrize, isSuccess: isSuccessWithCELO } = useCreatePublicCrosswordWithNativeCELOPrizePool();

  const [gridSize, setGridSize] = useState({ rows: 8, cols: 10 });
  const [clues, setClues] = useState<Clue[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [newClue, setNewClue] = useState({ clue: "", answer: "", direction: "across" as "across" | "down" });
  
  const [crosswordName, setCrosswordName] = useState<string>("");
  const [sponsoredBy, setSponsoredBy] = useState<string>("");
  
  const [prizePoolAmount, setPrizePoolAmount] = useState<string>("");
  const [prizePoolToken, setPrizePoolToken] = useState<string>("0x0000000000000000000000000000000000000000"); // CELO by default
  const [maxWinners, setMaxWinners] = useState<number>(3);
  const [winnerPercentages, setWinnerPercentages] = useState<string[]>(["5000", "3000", "2000"]); // Default: 50%, 30%, 20%
  const [endTime, setEndTime] = useState<string>(""); // Unix timestamp

  const isAnyLoading = isCreating || isCreatingWithTokenPrize || isCreatingWithCELOPrize;

  // Generate grid preview
  const generateGridPreview = () => {
    const grid: (string | null)[][] = Array(gridSize.rows)
      .fill(null)
      .map(() => Array(gridSize.cols).fill(null));

    const conflictCells: Set<string> = new Set();

    clues.forEach((clue) => {
      if (clue.answer) {
        if (clue.direction === "across") {
          for (let i = 0; i < clue.answer.length; i++) {
            const col = clue.col + i;
            if (col < gridSize.cols) {
              const existingLetter = grid[clue.row]?.[col]
              if (existingLetter && existingLetter !== clue.answer[i]) {
                conflictCells.add(`${clue.row}-${col}`)
              }
              grid[clue.row][col] = clue.answer[i]
            }
          }
        } else {
          for (let i = 0; i < clue.answer.length; i++) {
            const row = clue.row + i;
            if (row < gridSize.rows) {
              const existingLetter = grid[row]?.[clue.col]
              if (existingLetter && existingLetter !== clue.answer[i]) {
                conflictCells.add(`${row}-${clue.col}`)
              }
              grid[row][clue.col] = clue.answer[i]
            }
          }
        }
      }
    });

    return { grid, conflictCells };
  };

  const { grid: gridPreview, conflictCells } = generateGridPreview();

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleAddWord = () => {
    if (!selectedCell || !newClue.answer || !newClue.clue) {
      toast.error("Please select a cell and enter both clue and answer");
      return;
    }

    const answer = newClue.answer.toUpperCase();

    // Validate word fits in grid
    if (newClue.direction === "across" && selectedCell.col + answer.length > gridSize.cols) {
      toast.error("The word doesn't fit horizontally from this position");
      return;
    }
    if (newClue.direction === "down" && selectedCell.row + answer.length > gridSize.rows) {
      toast.error("The word doesn't fit vertically from this position");
      return;
    }

    // Check for conflicts
    const newConflicts: string[] = [];
    if (newClue.direction === "across") {
      for (let i = 0; i < answer.length; i++) {
        const col = selectedCell.col + i;
        const existingLetter = gridPreview[selectedCell.row]?.[col];
        if (existingLetter && existingLetter !== answer[i]) {
          newConflicts.push(`Conflict at row ${selectedCell.row}, col ${col}`);
        }
      }
    } else {
      for (let i = 0; i < answer.length; i++) {
        const row = selectedCell.row + i;
        const existingLetter = gridPreview[row]?.[selectedCell.col];
        if (existingLetter && existingLetter !== answer[i]) {
          newConflicts.push(`Conflict at row ${row}, col ${selectedCell.col}`);
        }
      }
    }

    if (newConflicts.length > 0) {
      toast.warning("Word has conflicts with existing words in the grid");
    }

    const maxNumber = Math.max(...clues.map((c) => c.number), 0);
    const newWord: Clue = {
      number: maxNumber + 1,
      clue: newClue.clue,
      answer: answer,
      row: selectedCell.row,
      col: selectedCell.col,
      direction: newClue.direction,
    };

    setClues([...clues, newWord]);
    setNewClue({ clue: "", answer: "", direction: "across" });
    setSelectedCell(null);
  };

  const removeClue = (index: number) => {
    setClues(clues.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (conflictCells.size > 0) {
      toast.error("Please resolve grid conflicts before saving");
      return;
    }

    if (clues.length === 0) {
      toast.error("Please add at least one word");
      return;
    }

    if (!crosswordName.trim()) {
      toast.error("Please enter a crossword name");
      return;
    }

    const crosswordData: CrosswordData = {
      gridSize,
      clues: clues.filter((c) => c.answer && c.clue),
      name: crosswordName,
      sponsoredBy: sponsoredBy,
    };

    // Generate deterministic ID
    let crosswordId = `0x`;
    if (typeof window !== 'undefined') {
      const encoder = new TextEncoder();
      const dataString = JSON.stringify(crosswordData);
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      crosswordId = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      crosswordId = `0x${Date.now().toString(16)}`;
    }

    // Prize pool validation (always enabled)
    if (!prizePoolAmount || parseFloat(prizePoolAmount) <= 0) {
      toast.error("Prize pool amount must be > 0");
      return;
    }

    const totalPercentage = winnerPercentages.reduce((sum, p) => sum + parseInt(p || "0"), 0);
    if (totalPercentage > 10000) {
      toast.error("Total percentage cannot exceed 100% (10000 basis points)");
      return;
    }

    const winnerPercentagesBigInt = winnerPercentages
      .map(p => BigInt(p || "0"))
      .filter(p => p > 0n);

    if (winnerPercentagesBigInt.length === 0) {
      toast.error("At least one winner percentage must be greater than 0");
      return;
    }

    const amountInWei = BigInt(Math.round(parseFloat(prizePoolAmount) * 1e18));
    const endTimeBigInt = endTime ? BigInt(endTime) : 0n;

    if (prizePoolToken === "0x0000000000000000000000000000000000000000") {
      createPublicCrosswordWithNativeCELOPrizePool([
        crosswordId as `0x${string}`,
        crosswordName,
        JSON.stringify(crosswordData),
        sponsoredBy || "",
        BigInt(maxWinners),
        amountInWei,
        winnerPercentagesBigInt,
        endTimeBigInt
      ], amountInWei);  // Send the prize pool amount as transaction value
    } else {
      createPublicCrosswordWithPrizePool([
        crosswordId as `0x${string}`,
        crosswordName,
        JSON.stringify(crosswordData),
        sponsoredBy || "",
        BigInt(maxWinners),
        prizePoolToken as `0x${string}`,
        amountInWei,
        winnerPercentagesBigInt,
        endTimeBigInt
      ]);
    }
  };

  // Success handler
  useEffect(() => {
    const success = isSuccess || isSuccessWithToken || isSuccessWithCELO;
    if (success) {
      toast.success("Crossword created and activated!");
      setTimeout(() => {
        router.push("/active-crosswords");
      }, 2000);
    }
  }, [isSuccess, isSuccessWithToken, isSuccessWithCELO, router]);

  // Sync percentages with maxWinners
  useEffect(() => {
    if (maxWinners > 0) {
      const newPercentages = [...winnerPercentages];
      while (newPercentages.length < maxWinners) newPercentages.push("0");
      if (newPercentages.length > maxWinners) newPercentages.splice(maxWinners);
      setWinnerPercentages(newPercentages);
    }
  }, [maxWinners]);

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
                      <Label className="font-bold">Sponsored By</Label>
                      <Input
                        placeholder="Optional"
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
                    <div className="flex gap-2">
                       <div className="flex-1">
                          <Label className="font-bold">Amount</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={prizePoolAmount}
                            onChange={(e) => setPrizePoolAmount(e.target.value)}
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
                            <option value="0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1">cUSD</option>
                          </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-bold">Max Winners</Label>
                        <Input
                          type="number"
                          value={maxWinners}
                          onChange={(e) => setMaxWinners(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="border-4 border-black font-bold"
                        />
                      </div>
                       <div>
                          <Label className="font-bold">End Time (Unix)</Label>
                           <Input
                            type="number"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="border-4 border-black font-bold"
                          />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-8 min-w-0 w-full">
          <div className="min-w-0 overflow-hidden w-full max-w-full">
            <Card className="border-4 border-black bg-card p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full w-full max-w-full overflow-hidden">
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
                        onChange={(e) => setGridSize({ ...gridSize, rows: Number.parseInt(e.target.value) || 1 })}
                        className="w-16 h-8 border-2 border-black font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold whitespace-nowrap">Cols:</Label>
                      <Input
                        type="number"
                        value={gridSize.cols}
                        onChange={(e) => setGridSize({ ...gridSize, cols: Number.parseInt(e.target.value) || 1 })}
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
                          return (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => handleCellClick(rowIdx, colIdx)}
                              className={`relative flex h-8 w-8 sm:h-10 sm:w-10 cursor-pointer items-center justify-center border-2 border-black text-[10px] sm:text-xs font-black ${
                                cell === null ? "bg-gray-800" : "bg-white"
                              } ${isSelected ? "ring-4 ring-primary" : ""} ${hasConflict ? "bg-destructive text-destructive-foreground" : ""}`}
                            >
                              {cellNumber && <span className="absolute left-0.5 top-0.5 text-[6px] sm:text-[8px] text-primary">{cellNumber}</span>}
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
                  onChange={(e) => setNewClue({ ...newClue, answer: e.target.value.toUpperCase() })}
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
                  onClick={handleSave}
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
      </div>
    </main>
  );
}