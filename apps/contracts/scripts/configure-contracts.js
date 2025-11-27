const hre = require("hardhat");

async function main() {
  console.log("Configuring CrosswordPrizes contract for native CELO support...\n");

  // Get wallet client
  const [deployer] = await hre.viem.getWalletClients();
  
  // The deployed contract addresses
  const CROSSWORD_BOARD_ADDRESS = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const CROSSWORD_PRIZES_ADDRESS = "0xf44bb9b994877ef7437336db8f7723c6bfeea2cf";

  console.log("CrosswordBoard contract:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract:", CROSSWORD_PRIZES_ADDRESS);

  // Load the contracts
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  console.log("\nChecking if native CELO (address 0x0) is allowed...");
  
  const isAllowed = await crosswordPrizes.read.allowedTokens(["0x0000000000000000000000000000000000000000"]);
  console.log("Native CELO is currently allowed:", isAllowed);

  if (!isAllowed) {
    console.log("\nAllowing native CELO in CrosswordPrizes contract...");
    const tx = await crosswordPrizes.write.setAllowedToken(
      ["0x0000000000000000000000000000000000000000", true], 
      { account: deployer.account }
    );
    console.log("✅ Native CELO allowed in CrosswordPrizes contract");
    console.log("Transaction hash:", tx);
  } else {
    console.log("✅ Native CELO is already allowed");
  }

  // Also make sure the CrosswordBoard has operator permissions to call recordCompletion
  const OPERATOR_ROLE = await crosswordPrizes.read.OPERATOR_ROLE();
  const crosswordBoardAddress = CROSSWORD_BOARD_ADDRESS;
  
  const hasOperatorRole = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, crosswordBoardAddress]);
  console.log("CrosswordBoard has OPERATOR_ROLE:", hasOperatorRole);

  if (!hasOperatorRole) {
    console.log("\nGranting OPERATOR_ROLE to CrosswordBoard contract...");
    const tx = await crosswordPrizes.write.grantRole(
      [OPERATOR_ROLE, crosswordBoardAddress], 
      { account: deployer.account }
    );
    console.log("✅ OPERATOR_ROLE granted to CrosswordBoard contract");
    console.log("Transaction hash:", tx);
  } else {
    console.log("✅ CrosswordBoard already has OPERATOR_ROLE");
  }

  console.log("\n✅ Configuration completed!");
  console.log("Native CELO should now be supported in the CrosswordPrizes contract.");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });