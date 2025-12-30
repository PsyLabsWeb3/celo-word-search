const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking specific crossword that's causing the error...\n");

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // The problematic crossword ID from the error
  const problematicCrosswordId = "0xc2480c91f97487cc69164f43e56b51d66562fe91fd30f1275a261400e10a3c6a";
  console.log(`Checking problematic crossword: ${problematicCrosswordId}\n`);

  try {
    // Try to get details for this specific crossword
    console.log("Attempting to get details for the problematic crossword...");
    const details = await crosswordBoard.read.getPublicCrosswordDetails([problematicCrosswordId]);
    console.log("✅ Successfully got crossword details!");
    console.log(`Name: ${details[0]}`);
    console.log(`Sponsored by: ${details[1]}`);
    console.log(`Is Active: ${details[10]}`);
  } catch (error) {
    console.log(`❌ Failed to get details for problematic crossword: ${error.message}`);
  }

  // Check the current crossword
  try {
    console.log("\nChecking current crossword...");
    const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
    console.log(`Current crossword ID: ${currentId}`);
    console.log(`Current crossword data length: ${currentData.length} chars`);
  } catch (error) {
    console.log(`❌ Failed to get current crossword: ${error.message}`);
  }

  // Check all active crosswords
  try {
    console.log("\nChecking all active public crosswords...");
    const activeCrosswords = await crosswordBoard.read.getActivePublicCrosswords();
    console.log(`Active crosswords count: ${activeCrosswords.length}`);
    console.log(`Active crossword IDs: ${activeCrosswords}`);
    
    // Check if problematic crossword is in the active list
    const isProblematicActive = activeCrosswords.some(id => id.toLowerCase() === problematicCrosswordId.toLowerCase());
    console.log(`Problematic crossword is active: ${isProblematicActive}`);
  } catch (error) {
    console.log(`❌ Failed to get active crosswords: ${error.message}`);
  }

  console.log("\n💡 The issue might be that the frontend is trying to check prize status for a specific crossword");
  console.log("   but using a function that expects the current crossword or has other constraints.");
  console.log("   The solution is to update the frontend to handle this properly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  });