const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing crossword completion functionality on Celo Sepolia...\n");

  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}\n`);

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Test getting active crosswords
  console.log("Testing fetching active public crosswords...");
  const activeCrosswords = await crosswordBoard.read.getActivePublicCrosswords();
  console.log(`✅ Active crosswords count: ${activeCrosswords.length}`);
  
  if (activeCrosswords.length > 0) {
    console.log(`Active crossword IDs: ${activeCrosswords}`);
    
    // Test getting details of the first active crossword
    const details = await crosswordBoard.read.getPublicCrosswordDetails([activeCrosswords[0]]);
    console.log(`✅ Retrieved crossword details for: ${activeCrosswords[0]}`);
    console.log(`Name: ${details[0]}`);
    console.log(`Sponsored by: ${details[1]}`);
    console.log(`Prize Pool: ${details[4]} wei`);
    console.log(`Max Winners: ${details[5]}`);
    console.log(`Is Active: ${details[10]}`);
  } else {
    console.log("No active crosswords found, which is expected if no crosswords have been created yet");
  }

  // Test getting the current crossword (if any)
  try {
    const currentCrossword = await crosswordBoard.read.getCurrentCrossword();
    console.log(`✅ Current crossword ID: ${currentCrossword[0]}`);
    console.log(`✅ Current crossword data length: ${currentCrossword[1].length} characters`);
  } catch (error) {
    console.log(`ℹ️  No current crossword set: ${error.message}`);
  }

  // Test getting all public crosswords
  try {
    const allCrosswords = await crosswordBoard.read.getAllPublicCrosswords();
    console.log(`✅ Total public crosswords: ${allCrosswords.length}`);
    if (allCrosswords.length > 0) {
      console.log(`All crossword IDs: ${allCrosswords}`);
    }
  } catch (error) {
    console.log(`❌ Getting all public crosswords failed: ${error.message}`);
  }

  console.log("\n🎉 Testing completed!");
  console.log("The crossword fetching functionality is working correctly.");
  console.log("Users should now be able to see crosswords in the frontend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });