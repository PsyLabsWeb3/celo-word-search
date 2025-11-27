const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Testing a simple admin function call to check permissions...\n");

  // Get wallet client
  const [deployer] = await hre.viem.getWalletClients();
  
  // The deployed contract addresses
  const CROSSWORD_BOARD_ADDRESS = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const CROSSWORD_PRIZES_ADDRESS = "0xf44bb9b994877ef7437336db8f7723c6bfeea2cf";

  console.log("CrosswordBoard contract:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract:", CROSSWORD_PRIZES_ADDRESS);
  console.log("Using deployer address:", deployer.account.address);

  // Load the contracts
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);

  // Test 1: Try setting max winners config (a simpler admin function)
  console.log("\n1. Testing setMaxWinnersConfig on CrosswordBoard...");
  try {
    const tx1 = await crosswordBoard.write.setMaxWinnersConfig([3], { account: deployer.account });
    console.log("✅ setMaxWinnersConfig succeeded with transaction:", tx1);
  } catch (error) {
    console.log("❌ setMaxWinnersConfig failed:", error.message);
    console.log("This might indicate an admin permission issue");
  }

  // Test 2: Try to call createCrossword directly on CrosswordPrizes to see if that works
  console.log("\n2. Testing createCrossword on CrosswordPrizes directly...");
  const testCrosswordId = "0x1234567890123456789012345678901234567890123456789012345678901234"; // 32 bytes
  const testData = JSON.stringify({
    gridSize: {rows: 8, cols: 10},
    clues: [{number: 1, clue: "test clue", answer: "TEST", row: 3, col: 0, direction: "across"}]
  });
  const testPrizePool = 10000000000000000n; // 0.01 CELO
  const testWinnerPercentages = [10000]; // 100%

  try {
    await crosswordPrizes.write.createCrosswordWithNativeCELO([
      testCrosswordId,
      testPrizePool,
      testWinnerPercentages,
      0 // endTime
    ], { 
      account: deployer.account,
      value: testPrizePool
    });
    console.log("✅ Direct createCrosswordWithNativeCELO on CrosswordPrizes succeeded");
  } catch (error) {
    console.log("❌ Direct createCrosswordWithNativeCELO on CrosswordPrizes failed:", error.message);
  }

  // Test 3: Verify the current state of max winners
  console.log("\n3. Checking current max winners configuration...");
  try {
    const maxWinnersFromBoard = await crosswordBoard.read.getMaxWinnersConfig();
    const maxWinnersFromPrizes = await crosswordPrizes.read.getMaxWinners();
    console.log("Max winners from CrosswordBoard:", maxWinnersFromBoard.toString());
    console.log("Max winners from CrosswordPrizes:", maxWinnersFromPrizes.toString());
  } catch (error) {
    console.log("❌ Failed to get max winners config:", error.message);
  }

  console.log("\n✅ Tests completed!");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });