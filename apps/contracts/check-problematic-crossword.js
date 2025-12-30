const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking if the crossword ID from the frontend exists as a public crossword...\n");

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // The problematic crossword ID from the error
  const problematicCrosswordId = "0xc2480c91f97487cc69164f43e56b51d66562fe91fd30f1275a261400e10a3c6a";
  console.log(`Checking if crossword exists: ${problematicCrosswordId}\n`);

  try {
    // Check if this crossword exists in public crosswords
    const allPublicCrosswords = await crosswordBoard.read.getAllPublicCrosswords();
    console.log(`Total public crosswords: ${allPublicCrosswords.length}`);
    
    const crosswordExists = allPublicCrosswords.some(id => id.toLowerCase() === problematicCrosswordId.toLowerCase());
    console.log(`Crossword ${problematicCrosswordId} exists in public list: ${crosswordExists}`);
    
    if (crosswordExists) {
      console.log(`\n✅ Crossword ${problematicCrosswordId} exists as a public crossword.`);
      
      // Get its details
      const details = await crosswordBoard.read.getPublicCrosswordDetails([problematicCrosswordId]);
      console.log(`Name: ${details[0]}`);
      console.log(`Sponsored by: ${details[1]}`);
      console.log(`Is Active: ${details[10]}`);
    } else {
      console.log(`\n❌ Crossword ${problematicCrosswordId} does NOT exist in the public list.`);
    }
    
    // Check the current crossword
    const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
    console.log(`\nCurrent crossword ID: ${currentId}`);
    console.log(`Current crossword matches problematic ID: ${currentId.toLowerCase() === problematicCrosswordId.toLowerCase()}`);
    
    // Check all active public crosswords
    const activeCrosswords = await crosswordBoard.read.getActivePublicCrosswords();
    console.log(`\nActive public crosswords: ${activeCrosswords.length}`);
    console.log(`Active crossword IDs: ${activeCrosswords}`);
    
    const isActive = activeCrosswords.some(id => id.toLowerCase() === problematicCrosswordId.toLowerCase());
    console.log(`Problematic crossword is active: ${isActive}`);
    
  } catch (error) {
    console.log(`❌ Error checking crossword: ${error.message}`);
  }

  console.log("\n💡 The issue is likely that the frontend is storing an old crossword ID.");
  console.log("When an admin updates the crossword, the frontend should refresh to use the new current crossword.");
  console.log("Try refreshing the page to get the latest crossword from the contract.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  });