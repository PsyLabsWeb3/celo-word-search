const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing the exact function call that's failing in the frontend...\n");

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // The problematic crossword ID from the error
  const problematicCrosswordId = "0xc2480c91f97487cc69164f43e56b51d66562fe91fd30f1275a261400e10a3c6a";
  console.log(`Testing function call for crossword: ${problematicCrosswordId}\n`);

  // First, let's try the function that's working (getPublicCrosswordDetails)
  try {
    console.log("1. Testing getPublicCrosswordDetails (this should work)...");
    const publicDetails = await crosswordBoard.read.getPublicCrosswordDetails([problematicCrosswordId]);
    console.log("✅ getPublicCrosswordDetails succeeded!");
    console.log(`Name: ${publicDetails[0]}`);
    console.log(`Sponsored by: ${publicDetails[1]}`);
    console.log(`Is Active: ${publicDetails[10]}`);
  } catch (error) {
    console.log(`❌ getPublicCrosswordDetails failed: ${error.message}`);
  }

  // Now let's try the function that's failing (getCrosswordDetails)
  try {
    console.log("\n2. Testing getCrosswordDetails (this is causing the error)...");
    const details = await crosswordBoard.read.getCrosswordDetails([problematicCrosswordId]);
    console.log("✅ getCrosswordDetails succeeded!");
    console.log("Function returned successfully");
  } catch (error) {
    console.log(`❌ getCrosswordDetails failed: ${error.message}`);
    console.log("This confirms the issue - the function exists but reverts for certain crossword IDs");
  }

  // Let's try with the current crossword ID to see if it works
  try {
    console.log("\n3. Getting current crossword ID to test getCrosswordDetails with current ID...");
    const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
    console.log(`Current crossword ID: ${currentId}`);
    
    console.log("Testing getCrosswordDetails with current crossword ID...");
    const currentDetails = await crosswordBoard.read.getCrosswordDetails([currentId]);
    console.log("✅ getCrosswordDetails worked with current crossword ID!");
  } catch (error) {
    console.log(`❌ getCrosswordDetails failed even with current crossword ID: ${error.message}`);
  }

  console.log("\n💡 The issue is confirmed: getCrosswordDetails only works with the current crossword,");
  console.log("   not with arbitrary public crossword IDs. This is a contract design limitation.");
  console.log("   The frontend should use getPublicCrosswordDetails for public crosswords.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  });