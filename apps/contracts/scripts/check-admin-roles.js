const hre = require("hardhat");

async function main() {
  console.log("Checking all admin roles and access controls...\n");

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

  // Check all roles for deployer in CrosswordBoard
  console.log("\n--- CrosswordBoard Roles for Deployer ---");
  const adminRoleBoard = await crosswordBoard.read.ADMIN_ROLE();
  const defaultAdminRoleBoard = await crosswordBoard.read.DEFAULT_ADMIN_ROLE();
  
  console.log("ADMIN_ROLE (keccak256):", adminRoleBoard);
  console.log("DEFAULT_ADMIN_ROLE (keccak256):", defaultAdminRoleBoard);
  
  const hasAdminRole = await crosswordBoard.read.hasRole([adminRoleBoard, deployer.account.address]);
  const hasDefaultAdminRole = await crosswordBoard.read.hasRole([defaultAdminRoleBoard, deployer.account.address]);
  
  console.log("Deployer has ADMIN_ROLE:", hasAdminRole);
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

  // Check if deployer was added as admin using the addAdmin function
  const isAdmin = await crosswordBoard.read.isAdmin([deployer.account.address]);
  console.log("Deployer is admin (via isAdmin mapping):", isAdmin);

  // Check all roles for deployer in CrosswordPrizes
  console.log("\n--- CrosswordPrizes Roles for Deployer ---");
  const adminRolePrizes = await crosswordPrizes.read.ADMIN_ROLE();
  const defaultAdminRolePrizes = await crosswordPrizes.read.DEFAULT_ADMIN_ROLE();
  const operatorRolePrizes = await crosswordPrizes.read.OPERATOR_ROLE();
  
  console.log("ADMIN_ROLE (keccak256):", adminRolePrizes);
  console.log("DEFAULT_ADMIN_ROLE (keccak256):", defaultAdminRolePrizes);
  console.log("OPERATOR_ROLE (keccak256):", operatorRolePrizes);
  
  const hasAdminRolePrizes = await crosswordPrizes.read.hasRole([adminRolePrizes, deployer.account.address]);
  const hasDefaultAdminRolePrizes = await crosswordPrizes.read.hasRole([defaultAdminRolePrizes, deployer.account.address]);
  const hasOperatorRolePrizes = await crosswordPrizes.read.hasRole([operatorRolePrizes, deployer.account.address]);
  
  console.log("Deployer has ADMIN_ROLE:", hasAdminRolePrizes);
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRolePrizes);
  console.log("Deployer has OPERATOR_ROLE:", hasOperatorRolePrizes);

  // Check if CrosswordBoard has OPERATOR_ROLE in CrosswordPrizes
  const boardHasOperatorRole = await crosswordPrizes.read.hasRole([operatorRolePrizes, CROSSWORD_BOARD_ADDRESS]);
  console.log("CrosswordBoard contract has OPERATOR_ROLE:", boardHasOperatorRole);

  // Try to call a simple admin function that should work
  console.log("\n--- Testing Simple Admin Functions ---");
  
  // First, let's try to grant admin role to deployer on CrosswordBoard if needed
  if (!hasAdminRole && !hasDefaultAdminRole) {
    console.log("Deployer doesn't have admin role on CrosswordBoard. This could be the issue!");
    console.log("Checking who is the owner/DEFAULT_ADMIN...");
    const owner = await crosswordBoard.read.owner();
    console.log("Owner of CrosswordBoard:", owner);
    
    // Check if deployer is the owner
    if (owner.toLowerCase() === deployer.account.address.toLowerCase()) {
      console.log("Deployer is the owner, so they should be able to add themselves as admin");
      try {
        // First try to grant ADMIN_ROLE to deployer
        const grantRoleTx = await crosswordBoard.write.grantRole([adminRoleBoard, deployer.account.address], { account: deployer.account });
        console.log("✅ ADMIN_ROLE granted to deployer on CrosswordBoard:", grantRoleTx);
      } catch (error) {
        console.error("❌ Failed to grant ADMIN_ROLE:", error.message);
      }
    } else {
      console.log("Deployer is NOT the owner of CrosswordBoard");
    }
  }

  // Test with a lower percentage (below 8000 = 80%)
  console.log("\n--- Testing with valid percentage values ---");
  try {
    await crosswordPrizes.write.createCrosswordWithNativeCELO([
      "0x1234567890123456789012345678901234567890123456789012345678901234",
      10000000000000000n, // 0.01 CELO
      [8000], // 80% - under the limit
      0 // endTime
    ], { 
      account: deployer.account,
      value: 10000000000000000n
    });
    console.log("✅ createCrosswordWithNativeCELO succeeded with 80% winner percentage");
  } catch (error) {
    console.log("❌ createCrosswordWithNativeCELO failed even with 80%:", error.message);
  }

  console.log("\n✅ Admin role check completed!");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });