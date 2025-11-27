const hre = require("hardhat");

async function main() {
  console.log("Checking CrosswordBoard to CrosswordPrizes contract linkage...\n");

  // Get wallet client
  const [deployer] = await hre.viem.getWalletClients();
  
  // The deployed contract addresses
  const CROSSWORD_BOARD_ADDRESS = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const CROSSWORD_PRIZES_ADDRESS = "0xf44bb9b994877ef7437336db8f7723c6bfeea2cf";

  console.log("CrosswordBoard contract:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract:", CROSSWORD_PRIZES_ADDRESS);
  console.log("Using deployer address:", deployer.account.address);

  // Load the contracts
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);

  // Check if CrosswordBoard has the correct CrosswordPrizes address
  const prizesContractAddress = await crosswordBoard.read.prizesContract();
  console.log("CrosswordBoard thinks CrosswordPrizes contract is at:", prizesContractAddress);
  
  if (prizesContractAddress.toLowerCase() === CROSSWORD_PRIZES_ADDRESS.toLowerCase()) {
    console.log("✅ CrosswordBoard is correctly linked to CrosswordPrizes contract");
  } else {
    console.error("❌ ERROR: CrosswordBoard is NOT linked to the correct CrosswordPrizes contract!");
    console.log("Expected:", CROSSWORD_PRIZES_ADDRESS);
    console.log("Actual:", prizesContractAddress);
  }

  // Check if the native CELO token is allowed in the prizes contract
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);
  const nativeCELOAllowed = await crosswordPrizes.read.allowedTokens(["0x0000000000000000000000000000000000000000"]);
  console.log("Native CELO allowed in CrosswordPrizes:", nativeCELOAllowed);

  // Test a simple call to CrosswordPrizes directly
  console.log("\n--- Testing CrosswordPrizes functions directly ---");
  try {
    // Check the total prize pool maximum percentage
    const maxPercentage = await crosswordPrizes.read.MAX_PERCENTAGE();
    console.log("Maximum percentage allowed in CrosswordPrizes:", maxPercentage.toString());

    // Check max winners
    const maxWinners = await crosswordPrizes.read.MAX_CONFIGURABLE_WINNERS();
    console.log("Maximum configurable winners in CrosswordPrizes:", maxWinners.toString());
    
    // Check single winner percentage limit
    const maxSingleWinnerPercentage = await crosswordPrizes.read.MAX_SINGLE_WINNER_PERCENTAGE();
    console.log("Maximum single winner percentage:", maxSingleWinnerPercentage.toString());
  } catch (error) {
    console.error("❌ Failed to read contract constants:", error.message);
  }

  console.log("\n✅ Contract link check completed!");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });