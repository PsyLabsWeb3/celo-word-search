const hre = require("hardhat");

async function main() {
  console.log("Checking contract states...\n");

  // Get the deployed contracts
  const CROSSWORD_BOARD_ADDRESS = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const CROSSWORD_PRIZES_ADDRESS = "0xf44bb9b994877ef7437336db8f7723c6bfeea2cf";

  console.log("CrosswordBoard contract:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract:", CROSSWORD_PRIZES_ADDRESS);

  // Load the contracts
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  // Check if the contracts are paused
  const boardPaused = await crosswordBoard.read.paused();
  const prizesPaused = await crosswordPrizes.read.paused();
  console.log("CrosswordBoard paused:", boardPaused);
  console.log("CrosswordPrizes paused:", prizesPaused);

  // Check if the deployer is still an admin
  const ADMIN_ROLE = await crosswordPrizes.read.ADMIN_ROLE();
  const deployerAddress = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";
  const deployerHasAdminRole = await crosswordPrizes.read.hasRole([ADMIN_ROLE, deployerAddress]);
  console.log("Deployer has ADMIN_ROLE in CrosswordPrizes:", deployerHasAdminRole);

  const boardHasAdmin = await crosswordBoard.read.isAdmin([deployerAddress]);
  console.log("Deployer is admin in CrosswordBoard:", boardHasAdmin);

  // Check the operator role for CrosswordBoard
  const OPERATOR_ROLE = await crosswordPrizes.read.OPERATOR_ROLE();
  const boardHasOperatorRole = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, CROSSWORD_BOARD_ADDRESS]);
  console.log("CrosswordBoard has OPERATOR_ROLE in CrosswordPrizes:", boardHasOperatorRole);

  // Check if native CELO is allowed
  const nativeCELOAllowed = await crosswordPrizes.read.allowedTokens(["0x0000000000000000000000000000000000000000"]);
  console.log("Native CELO allowed in CrosswordPrizes:", nativeCELOAllowed);

  console.log("\n✅ Contract states checked!");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });