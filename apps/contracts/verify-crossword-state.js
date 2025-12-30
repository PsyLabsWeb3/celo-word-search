const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying crossword state after setting current crossword...\n");

  // Get contract instance
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Get current crossword state
  console.log("Fetching current crossword state...");
  const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
  
  console.log(`✅ Current crossword ID: ${currentId}`);
  console.log(`✅ Current crossword data length: ${currentData.length} characters`);
  console.log(`✅ Last update time: ${new Date(Number(updateTime) * 1000).toISOString()}`);
  
  if (currentId !== "0x0000000000000000000000000000000000000000000000000000000000000000" && currentData.length > 0) {
    console.log("\n🎉 SUCCESS: Current crossword is properly set!");
    console.log("Users should now be able to play this crossword from the frontend.");
  } else {
    console.log("\n❌ ISSUE: Current crossword is not properly set.");
    console.log("The crossword ID is still 0 or data is empty.");
  }

  // Also check if there are any public crosswords available
  console.log("\nChecking public crosswords...");
  const publicCrosswords = await crosswordBoard.read.getActivePublicCrosswords();
  console.log(`Active public crosswords count: ${publicCrosswords.length}`);
  
  if (publicCrosswords.length > 0) {
    console.log(`Active crossword IDs: ${publicCrosswords}`);
    
    // Get details of the first public crossword
    const details = await crosswordBoard.read.getPublicCrosswordDetails([publicCrosswords[0]]);
    console.log(`\nDetails for first public crossword (${publicCrosswords[0]}):`);
    console.log(`Name: ${details[0]}`);
    console.log(`Sponsored by: ${details[1]}`);
    console.log(`Crossword data length: ${details[2].length} characters`);
    console.log(`Token: ${details[3]}`);
    console.log(`Total prize pool: ${details[4]}`);
    console.log(`Max winners: ${details[5]}`);
    console.log(`Is active: ${details[10]}`);
  }

  console.log("\n✅ Verification completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });