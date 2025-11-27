"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, AlertCircle, Upload, RefreshCw, Settings } from "lucide-react"
import { useAccount } from "wagmi"
import { useIsAdmin, useSetCrossword, useGetMaxWinnersConfig, useSetConfig, useSetCrosswordAndMaxWinners } from "@/hooks/useContract"
import { useCrossword } from "@/contexts/crossword-context"
import { useQueryClient } from "@tanstack/react-query"

interface Clue {
  number: number
  clue: string
  answer: string
  row: number
  col: number
  direction: "across" | "down"
}

interface CrosswordData {
  gridSize: { rows: number; cols: number }
  clues: Clue[]
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: isAdminData, isLoading: isAdminLoading } = useIsAdmin();
  const { setCrossword, isLoading: isSetCrosswordLoading, isSuccess, isError, error, txHash, contractAddress } = useSetCrossword();
  const { data: maxWinnersConfigData, isLoading: isMaxWinnersConfigLoading, refetch: refetchMaxWinnersConfig } = useGetMaxWinnersConfig();
  const { setMaxWinnersConfig, isLoading: isConfigUpdateLoading } = useSetConfig();
  const { setCrosswordAndMaxWinners, isLoading: isSetCrosswordAndMaxWinnersLoading, isSuccess: isCrosswordAndMaxWinnersSuccess, isError: isCrosswordAndMaxWinnersError } = useSetCrosswordAndMaxWinners();
  const { currentCrossword, refetchCrossword } = useCrossword(); // Added to refetch after saving
  const queryClient = useQueryClient();

  const [gridSize, setGridSize] = useState({ rows: 8, cols: 10 })
  const [clues, setClues] = useState<Clue[]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [newClue, setNewClue] = useState({ clue: "", answer: "", direction: "across" as "across" | "down" })
  const [conflicts, setConflicts] = useState<string[]>([])
  const [isSavingToBlockchain, setIsSavingToBlockchain] = useState(false);
  const [isLoadingFromBlockchain, setIsLoadingFromBlockchain] = useState(true);

  // Configuration state
  const [maxWinners, setMaxWinners] = useState<number>(3);
  const [prizePoolAmount, setPrizePoolAmount] = useState<string>("");
  const [prizePoolToken, setPrizePoolToken] = useState<string>("CELO");
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Initialize with empty state - no saved data from localStorage anymore

  // Load current crossword from blockchain when available
  useEffect(() => {
    if (currentCrossword?.data) {
      try {
        const parsedData = JSON.parse(currentCrossword.data);
        setGridSize(parsedData.gridSize);
        setClues(parsedData.clues);
        setIsLoadingFromBlockchain(false);
      } catch (error) {
        console.error("Error parsing crossword data:", error);
        setIsLoadingFromBlockchain(false);
      }
    } else {
      // If no crossword data from the blockchain, set loading to false
      setIsLoadingFromBlockchain(false);
    }
  }, [currentCrossword]);

  // Load configuration values when available
  useEffect(() => {
    if (maxWinnersConfigData !== undefined) {
      setMaxWinners(Number(maxWinnersConfigData));
    }
  }, [maxWinnersConfigData]);

  const generateGridPreview = () => {
    const grid: (string | null)[][] = Array(gridSize.rows)
      .fill(null)
      .map(() => Array(gridSize.cols).fill(null))

    const conflictCells: Set<string> = new Set()

    clues.forEach((clue) => {
      if (clue.answer) {
        if (clue.direction === "across") {
          for (let i = 0; i < clue.answer.length; i++) {
            const col = clue.col + i
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
            const row = clue.row + i
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
    })

    return { grid, conflictCells }
  }

  const { grid: gridPreview, conflictCells } = generateGridPreview()

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col })
  }

  const handleAddWord = () => {
    if (!selectedCell || !newClue.answer || !newClue.clue) {
      alert("Please select a cell in the grid and complete the clue and answer")
      return
    }

    const answer = newClue.answer.toUpperCase()

    // Validate word fits in grid
    if (newClue.direction === "across" && selectedCell.col + answer.length > gridSize.cols) {
      alert("The word doesn't fit horizontally from this position")
      return
    }
    if (newClue.direction === "down" && selectedCell.row + answer.length > gridSize.rows) {
      alert("The word doesn't fit vertically from this position")
      return
    }

    // Check for conflicts with existing words
    const newConflicts: string[] = []
    if (newClue.direction === "across") {
      for (let i = 0; i < answer.length; i++) {
        const col = selectedCell.col + i
        const existingLetter = gridPreview[selectedCell.row]?.[col]
        if (existingLetter && existingLetter !== answer[i]) {
          newConflicts.push(`Conflicto en fila ${selectedCell.row}, col ${col}: ${existingLetter} vs ${answer[i]}`)
        }
      }
    } else {
      for (let i = 0; i < answer.length; i++) {
        const row = selectedCell.row + i
        const existingLetter = gridPreview[row]?.[selectedCell.col]
        if (existingLetter && existingLetter !== answer[i]) {
          newConflicts.push(`Conflicto en fila ${row}, col ${selectedCell.col}: ${existingLetter} vs ${answer[i]}`)
        }
      }
    }

    if (newConflicts.length > 0) {
      const proceed = confirm(`Hay conflictos:\n${newConflicts.join("\n")}\n\n¿Agregar de todas formas?`)
      if (!proceed) return
    }

    const maxNumber = Math.max(...clues.map((c) => c.number), 0)
    const newWord: Clue = {
      number: maxNumber + 1,
      clue: newClue.clue,
      answer: answer,
      row: selectedCell.row,
      col: selectedCell.col,
      direction: newClue.direction,
    }

    setClues([...clues, newWord])
    setNewClue({ clue: "", answer: "", direction: "across" })
    setSelectedCell(null)
  }

  const removeClue = (index: number) => {
    setClues(clues.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    // Validate no conflicts
    if (conflictCells.size > 0) {
      alert("There are conflicts in the crossword. Please resolve all conflicts before saving.")
      return
    }

    const crosswordData: CrosswordData = {
      gridSize,
      clues: clues.filter((c) => c.answer && c.clue),
    }

    // Validate we have at least one clue
    if (crosswordData.clues.length === 0) {
      alert("Please add at least one word to the crossword before saving.")
      return;
    }

    // Validate max winners is set to a valid value
    if (!maxWinners || maxWinners < 1 || maxWinners > 10) {
      alert("Please set the number of maximum winners (between 1 and 10) in the Prize Configuration section before saving.")
      return;
    }

    // Save both crossword and max winners in a single transaction
    try {
      setIsSavingToBlockchain(true);

      // Generate a deterministic crossword ID using the hash of the crossword data
      const dataString = JSON.stringify(crosswordData);

      // Use a simple hash approach that works in browser context
      let crosswordId = `0x`;
      if (typeof window !== 'undefined') {
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        crosswordId = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback for server-side or if crypto is not available
        crosswordId = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2)}`;
      }


      // Call the blockchain function to save both crossword and max winners in a single transaction
      setCrosswordAndMaxWinners([crosswordId as `0x${string}`, dataString, BigInt(maxWinners)]);

    } catch (error) {
      alert("Error saving crossword to blockchain: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsSavingToBlockchain(false);
    }
  }

  // Effect to handle success after transaction
  const successAlertShown = useRef(false);

  useEffect(() => {
    if (isSuccess && !successAlertShown.current) {
      alert("✓ Crossword saved successfully to the blockchain");
      // Add a small delay to ensure blockchain has time to update before refetching
      setTimeout(() => {
        // Invalidate and refetch the crossword data to ensure we get fresh data from blockchain
        queryClient.invalidateQueries({
          queryKey: ['readContract', {
            address: contractAddress,
            functionName: 'getCurrentCrossword'
          }]
        }).then(() => {
          // After invalidating cache, refetch the crossword data to update the context
          refetchCrossword();
        });
      }, 2000); // 2 second delay to ensure transaction is confirmed on blockchain
      // Mark that the alert has been shown to prevent multiple alerts
      successAlertShown.current = true;
      // Reset the local loading state since transaction is complete
      setIsSavingToBlockchain(false);
    }
  }, [isSuccess, refetchCrossword, queryClient, contractAddress, txHash]);

  // Effect to handle success for the combined transaction
  useEffect(() => {
    if (isCrosswordAndMaxWinnersSuccess && !successAlertShown.current) {
      alert("✓ Crossword and max winners configuration saved successfully to the blockchain");
      // Add a small delay to ensure blockchain has time to update before refetching
      setTimeout(() => {
        // Invalidate and refetch both crossword data and max winners config
        queryClient.invalidateQueries({
          queryKey: ['readContract', {
            address: contractAddress,
            functionName: 'getCurrentCrossword'
          }]
        }).then(() => {
          queryClient.invalidateQueries({
            queryKey: ['readContract', {
              address: contractAddress,
              functionName: 'getMaxWinnersConfig'
            }]
          }).then(() => {
            // After invalidating cache, refetch the crossword data to update the context
            refetchCrossword();
          });
        });
      }, 2000); // 2 second delay to ensure transaction is confirmed on blockchain
      // Mark that the alert has been shown to prevent multiple alerts
      successAlertShown.current = true;
      // Reset the local loading state since transaction is complete
      setIsSavingToBlockchain(false);
    }
  }, [isCrosswordAndMaxWinnersSuccess, refetchCrossword, queryClient, contractAddress]);

  // Effect to handle error state
  useEffect(() => {
    if (isError || isCrosswordAndMaxWinnersError) {
      setIsSavingToBlockchain(false); // Reset loading state when there's an error
    }
  }, [isError, isCrosswordAndMaxWinnersError, error]);

  // Reset the success flag when starting a new save operation
  useEffect(() => {
    if (isSavingToBlockchain) {
      successAlertShown.current = false;
    }
  }, [isSavingToBlockchain]);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the entire crossword?")) {
      setClues([])
      setGridSize({ rows: 8, cols: 10 })
      setSelectedCell(null)
    }
  }

  // Check if user is connected and has admin access
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-2xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-bold">Admin Panel</h2>
          <p className="mb-6 text-lg">Please connect your wallet to access the admin panel.</p>
        </Card>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
          <p className="text-lg font-bold">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdminData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-2xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-bold">Acceso Denegado</h2>
          <p className="mb-6 text-lg">You don't have admin permissions to access this section.</p>
          <p className="text-sm text-muted-foreground">Wallet: {address}</p>
        </Card>
      </div>
    );
  }

  // Check if user is connected and has admin access
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-2xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-bold">Admin Panel</h2>
          <p className="mb-6 text-lg">Please connect your wallet to access the admin panel.</p>
        </Card>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
          <p className="text-lg font-bold">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  if (isLoadingFromBlockchain) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
          <p className="text-lg font-bold">Loading current crossword from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!isAdminData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-2xl p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-bold">Acceso Denegado</h2>
          <p className="mb-6 text-lg">You don't have admin permissions to access this section.</p>
          <p className="text-sm text-muted-foreground">Wallet: {address}</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen p-4 bg-background sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 text-center md:mb-8">
            <h1 className="text-3xl font-black tracking-tight uppercase text-foreground sm:text-4xl md:text-5xl">
              Interactive Editor
            </h1>
            <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
              Click on the grid to position your words
            </p>
          </div>

          <div className="grid gap-8 xl:grid-cols-12">
            {/* Controls Panel */}
            <div className="space-y-6 xl:col-span-4">
              {/* Grid Size */}
              <Card className="border-4 border-black bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="mb-4 text-xl font-black uppercase text-foreground">Grid Size</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">Rows</Label>
                    <Input
                      type="number"
                      value={gridSize.rows}
                      onChange={(e) => setGridSize({ ...gridSize, rows: Number.parseInt(e.target.value) || 1 })}
                      min={1}
                      max={20}
                      className="border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                  <div>
                    <Label className="font-bold">Columns</Label>
                    <Input
                      type="number"
                      value={gridSize.cols}
                      onChange={(e) => setGridSize({ ...gridSize, cols: Number.parseInt(e.target.value) || 1 })}
                      min={1}
                      max={20}
                      className="border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                </div>
              </Card>

              {/* Add Word */}
              <Card className="border-4 border-black bg-popover p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="mb-4 text-xl font-black uppercase text-foreground">Add Word</h2>

                {selectedCell && (
                  <div className="p-2 mb-3 font-bold text-center border-2 rounded border-primary bg-primary/10">
                    Selected position: Row {selectedCell.row}, Col {selectedCell.col}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="font-bold">Direction</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        onClick={() => setNewClue({ ...newClue, direction: "across" })}
                        variant={newClue.direction === "across" ? "default" : "outline"}
                        className="flex-1 font-black uppercase border-2 border-black"
                      >
                        Horizontal
                      </Button>
                      <Button
                        onClick={() => setNewClue({ ...newClue, direction: "down" })}
                        variant={newClue.direction === "down" ? "default" : "outline"}
                        className="flex-1 font-black uppercase border-2 border-black"
                      >
                        Vertical
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="font-bold">Answer</Label>
                    <Input
                      value={newClue.answer}
                      onChange={(e) => setNewClue({ ...newClue, answer: e.target.value.toUpperCase() })}
                      className="font-bold uppercase border-2 border-black"
                      placeholder="REACT"
                    />
                  </div>

                  <div>
                    <Label className="font-bold">Clue</Label>
                    <Textarea
                      value={newClue.clue}
                      onChange={(e) => setNewClue({ ...newClue, clue: e.target.value })}
                      className="font-bold border-2 border-black"
                      placeholder="A JavaScript library..."
                    />
                  </div>

                  <Button
                    onClick={handleAddWord}
                    className="w-full border-4 border-black bg-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-primary hover:shadow-none"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Grid
                  </Button>
                </div>
             
             {/* Actions */}
              <div className="flex flex-col gap-4 mt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSavingToBlockchain || isSetCrosswordLoading || isSetCrosswordAndMaxWinnersLoading}
                  className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSavingToBlockchain || isSetCrosswordLoading || isSetCrosswordAndMaxWinnersLoading) ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to Blockchain
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-4 border-black bg-destructive font-black uppercase text-destructive-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-destructive hover:shadow-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              
              </div>
              </Card>

           
            </div>

            {/* Grid Preview */}
            <div className="flex flex-col gap-6 xl:col-span-8">
              <Card className="flex flex-col border-4 border-black bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1">
                <h2 className="mb-4 text-xl font-black uppercase text-foreground">
                  Grid Preview
                  {conflictCells.size > 0 && (
                    <span className="ml-3 text-sm text-destructive">
                      <AlertCircle className="inline w-4 h-4" /> {conflictCells.size} conflicts
                    </span>
                  )}
                </h2>

                <div className="flex items-center justify-center flex-1 overflow-x-auto">
                  <div className="inline-block border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-min">
                    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)` }}>
                      {gridPreview.map((row, rowIdx) =>
                        row.map((cell, colIdx) => {
                          const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                          const hasConflict = conflictCells.has(`${rowIdx}-${colIdx}`)
                          const cellClues = clues.filter(
                            (c) =>
                              (c.direction === "across" && c.row === rowIdx && c.col === colIdx) ||
                              (c.direction === "down" && c.col === colIdx && c.row === rowIdx),
                          )
                          const cellNumber = cellClues.length > 0 ? cellClues[0].number : null

                          return (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => handleCellClick(rowIdx, colIdx)}
                              className={`relative flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-black text-xs font-black transition-all hover:scale-105 ${
                                cell === null ? "bg-gray-800" : "bg-white"
                              } ${isSelected ? "ring-4 ring-primary" : ""} ${
                                hasConflict ? "bg-destructive text-destructive-foreground" : ""
                              }`}
                            >
                              {cellNumber && (
                                <span className="absolute left-0.5 top-0.5 text-[8px] font-bold text-primary">
                                  {cellNumber}
                                </span>
                              )}
                              {cell}
                            </div>
                          )
                        }),
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs font-bold text-muted-foreground">
                  💡 Click on a grid cell, then add a word from the left panel
                </div>
              </Card>

              {/* Words List */}
              {clues.length > 0 && (
                <Card className="border-4 border-black bg-popover p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="mb-4 text-xl font-black uppercase text-foreground">
                    Words Added ({clues.length})
                  </h2>
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {clues.map((clue, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="flex-1">
                          <div className="font-black text-primary">
                            {clue.number}. {clue.answer} ({clue.direction === "across" ? "→" : "↓"})
                          </div>
                          <div className="text-xs font-bold text-muted-foreground">
                            Fila {clue.row}, Col {clue.col}: {clue.clue}
                          </div>
                        </div>
                        <Button
                          onClick={() => removeClue(index)}
                          variant="outline"
                          size="sm"
                          className="font-bold border-2 border-black hover:bg-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            
          </div>

        {/* Configuration Section */}
        <div className="mt-12">
          <Card className="border-4 border-black bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 mr-3 text-foreground" />
              <h2 className="text-2xl font-black uppercase text-foreground">Grants Configuration</h2>
            </div>

            {/* Responsive layout using flexbox to stack on mobile, side-by-side on larger screens */}
            <div className="flex flex-col gap-6 md:flex-row md:gap-6">
              {/* Max Winners Configuration - takes full width on mobile, half on larger screens */}
              <div className="flex-1 min-w-0">
                <Card className="border-4 border-black bg-popover p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">Prize Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-bold">Maximum Winners</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={maxWinners}
                        onChange={(e) => setMaxWinners(Math.min(10, Math.max(1, Number(e.target.value))))}
                        className="border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Set the number of top finishers who will receive prizes (1-10)
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      <strong>Note:</strong> This will be updated when you save the crossword using the main "Upload to Blockchain" button.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Prize Pool Funding - takes full width on mobile, half on larger screens */}
              <div className="flex-1 min-w-0">
                <Card className="border-4 border-black bg-popover p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">Prize Pool Funding</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-bold">Fund Prize Pool</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Amount to deposit"
                          className="border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1"
                        />
                        <select className="border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white px-3">
                          <option value="CELO">CELO</option>
                          <option value="cUSD">cUSD</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Deposit tokens to fund the prize pool for crosswords
                      </p>
                    </div>

                    <Button
                      onClick={() => console.log("Deposit funds functionality would be implemented here")}
                      disabled={isConfigUpdateLoading}
                      className="w-full border-4 border-black bg-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-primary hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Deposit Funds
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
        </div>

      </main>
    </>
  )
}