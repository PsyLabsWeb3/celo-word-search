"use client";

import React, { useState, useEffect } from "react";

const GRID_SIZE = 10;
const WORDS_TO_FIND = ["BLOCKCHAIN", "CELO", "CRYPTO", "STABLE", "WEB3"];

const WordSearchGrid = () => {
  // Generate initial grid with random letters
  const generateInitialGrid = () => {
    // Initialize empty grid
    const grid: string[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => "")
      );

    // Place the words in the grid
    WORDS_TO_FIND.forEach((word) => {
      placeWordInGrid(grid, word);
    });

    // Fill remaining empty cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === "") {
          grid[row][col] = String.fromCharCode(
            Math.floor(Math.random() * 26) + 65
          );
        }
      }
    }

    return grid;
  };

  // Place a word in the grid
  const placeWordInGrid = (grid: string[][], word: string) => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal down-right
      [-1, 1], // diagonal up-right
      [0, -1], // horizontal backwards
      [-1, 0], // vertical backwards
      [-1, -1], // diagonal up-left
      [1, -1], // diagonal down-left
    ];

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);

      // Check if the word fits in the grid in this direction
      const endRow = startRow + direction[0] * (word.length - 1);
      const endCol = startCol + direction[1] * (word.length - 1);

      if (
        endRow >= 0 &&
        endRow < GRID_SIZE &&
        endCol >= 0 &&
        endCol < GRID_SIZE
      ) {
        // Check if the positions are free or match the word
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const row = startRow + direction[0] * i;
          const col = startCol + direction[1] * i;
          const currentChar = grid[row][col];
          // If the cell is not empty and doesn't match the letter we want to place, we can't place here
          if (currentChar !== "" && currentChar !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          // Place the word
          for (let i = 0; i < word.length; i++) {
            const row = startRow + direction[0] * i;
            const col = startCol + direction[1] * i;
            grid[row][col] = word[i];
          }
          placed = true;
        }
      }

      attempts++;
    }
  };

  const [grid] = useState<string[][]>(generateInitialGrid());
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordCells, setFoundWordCells] = useState<{
    [word: string]: [number, number][];
  }>({});
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Check if a word has been found
  const checkWord = (cells: [number, number][]) => {
    if (cells.length < 3) return null; // Words should be at least 3 letters

    // Get the letters from the selected cells
    const selectedLetters = cells.map(([row, col]) => grid[row][col]);
    const selectedWord = selectedLetters.join("");
    const reversedWord = selectedLetters.slice().reverse().join("");

    // Check if the selected word matches any of the target words
    const foundWord = WORDS_TO_FIND.find(
      (word) => word === selectedWord || word === reversedWord
    );

    return foundWord;
  };

  // Add event listener for mouse up on window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        handleMouseUp();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [isMouseDown, selectedCells, foundWords]);

  // Helper to get coordinates from touch event
  const getTouchCoords = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return null;

    const cellId = element.getAttribute("data-cell-id");
    if (!cellId) return null;

    const [r, c] = cellId.split("-").map(Number);
    return [r, c] as [number, number];
  };

  const handleTouchStart = (row: number, col: number) => {
    handleMouseDown(row, col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDown) return;
    const coords = getTouchCoords(e);
    if (coords) {
      handleMouseEnter(coords[0], coords[1]);
    }
  };

  // Handle mouse down on a cell
  const handleMouseDown = (row: number, col: number) => {
    setIsMouseDown(true);
    setStartCell([row, col]);
    setSelectedCells([[row, col]]);
  };

  // Handle mouse enter on a cell
  const handleMouseEnter = (row: number, col: number) => {
    if (!isMouseDown || !startCell) return;

    const [startRow, startCol] = startCell;

    // Determine the direction
    const rowDiff = row - startRow;
    const colDiff = col - startCol;

    // Check if the movement is horizontal, vertical, or diagonal (45 degrees)
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    const isHorizontal = rowDiff === 0;
    const isVertical = colDiff === 0;
    const isDiagonal = absRowDiff === absColDiff;

    if (!isHorizontal && !isVertical && !isDiagonal) return;

    const path: [number, number][] = [];
    const steps = Math.max(absRowDiff, absColDiff);

    if (steps === 0) {
      path.push([startRow, startCol]);
    } else {
      const rowStep = rowDiff === 0 ? 0 : rowDiff / absRowDiff;
      const colStep = colDiff === 0 ? 0 : colDiff / absColDiff;

      for (let i = 0; i <= steps; i++) {
        const newRow = startRow + rowStep * i;
        const newCol = startCol + colStep * i;
        path.push([Math.round(newRow), Math.round(newCol)]);
      }
    }

    setSelectedCells(path);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (!isMouseDown) return;

    const foundWord = checkWord(selectedCells);
    if (foundWord && !foundWords.includes(foundWord)) {
      setFoundWords([...foundWords, foundWord]);
      setFoundWordCells((prev) => ({
        ...prev,
        [foundWord]: selectedCells,
      }));
    }

    setIsMouseDown(false);
    setStartCell(null);
    setSelectedCells([]);
  };

  // Check if the game is complete
  useEffect(() => {
    if (foundWords.length === WORDS_TO_FIND.length) {
      setIsComplete(true);
    }
  }, [foundWords]);

  // Check if a cell is selected
  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  };

  // Check if a cell is part of a found word
  const isCellFound = (row: number, col: number) => {
    // Check if this cell is part of any found word
    for (const word in foundWordCells) {
      const cells = foundWordCells[word];
      if (cells.some(([r, c]) => r === row && c === col)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Grid */}
      <div className="flex-1">
        <div className="border-4 border-black bg-orange-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div
            className="grid grid-cols-10 gap-1 sm:gap-2"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = isCellSelected(rowIndex, colIndex);
                const isFound = isCellFound(rowIndex, colIndex);

                let cellClasses =
                  "bg-white/90 backdrop-blur-sm border border-black/5 aspect-square flex items-center justify-center font-black text-sm sm:text-lg md:text-xl text-black cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 rounded-md sm:rounded-lg shadow-sm touch-none ";

                if (isSelected) {
                  cellClasses +=
                    "bg-blue-500 text-white border-blue-600 scale-105 shadow-md z-10 ";
                } else if (isFound) {
                  cellClasses +=
                    "bg-emerald-500 text-white border-emerald-600 shadow-sm ";
                } else {
                  cellClasses += "hover:bg-gray-50 hover:border-black/30 ";
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-cell-id={`${rowIndex}-${colIndex}`}
                    className={cellClasses}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                  >
                    {cell}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Words List */}
      <div className="lg:w-1/3">
        <div className="border-4 border-black bg-orange-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full">
          <h2 className="text-2xl font-black mb-4">WORDS TO FIND</h2>
          <ul className="flex flex-wrap lg:flex-col gap-2">
            {WORDS_TO_FIND.map((word, index) => (
              <li
                key={index}
                className={`font-black text-sm sm:text-base md:text-lg px-3 py-1.5 rounded-full border border-black/5 ${
                  foundWords.includes(word)
                    ? "bg-emerald-500/10 text-emerald-600 line-through border-emerald-500/20"
                    : "bg-white/50 text-black shadow-sm"
                }`}
              >
                {word}
              </li>
            ))}
          </ul>

          {isComplete && (
            <div className="mt-6 animate-pulse">
              <div className="border-4 border-black bg-yellow-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 text-center">
                <h3 className="text-2xl font-black">MISSION COMPLETE!</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordSearchGrid;
