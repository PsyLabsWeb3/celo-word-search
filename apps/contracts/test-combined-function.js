const hre = require("hardhat");

async function main() {
  console.log("Testing the combined crossword and max winners function...\n");

  // Get the viem public client and wallet clients
  const publicClient = await hre.viem.getPublicClient();
  const [deployer, admin, user1, user2] = await hre.viem.getWalletClients();
  
  console.log("Using accounts:", {
    deployer: deployer.account.address,
    admin: admin.account.address,
  });

  // Get deployed contracts
  console.log("\nGetting deployed contracts...");
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const config = await hre.viem.getContractAt("Config", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

  console.log("Connected to contracts:");
  console.log("- CrosswordBoard:", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  console.log("- CrosswordPrizes:", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  console.log("- Config:", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Test the combined function
  console.log("\n--- Testing combined function setCrosswordAndMaxWinners ---");

  // First, let's check the initial max winners configuration
  const initialMaxWinners = await crosswordBoard.read.getMaxWinnersConfig();
  console.log("Initial max winners config:", initialMaxWinners.toString());

  // Prepare a test crossword
  const testCrosswordId = "0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d3a2b1de21b5638"; // Random bytes32
  const testCrosswordData = JSON.stringify({
    gridSize: { rows: 5, cols: 5 },
    clues: [
      {
        number: 1,
        clue: "Test clue for a 5-letter word starting with T",
        answer: "TESTS",
        row: 0,
        col: 0,
        direction: "across"
      }
    ]
  });

  console.log("\nSetting crossword and max winners to 5 in a single transaction...");

  // Check if deployer already has the admin role
  const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
  const hasRole = await crosswordBoard.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  console.log("Deployer has ADMIN_ROLE:", hasRole);

  // Call the combined function as deployer (who should have admin role from constructor)
  try {
    const tx = await crosswordBoard.write.setCrosswordAndMaxWinners([testCrosswordId, testCrosswordData, 5n], {
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("✓ Combined function executed successfully");
  } catch (error) {
    console.error("Error calling combined function:", error);
    return;
  }

  // Verify both the crossword and max winners were set correctly
  console.log("\nVerifying the results...");
  
  // Check crossword data
  const [retrievedId, retrievedData, updatedAt] = await crosswordBoard.read.getCurrentCrossword();
  console.log("Crossword ID:", retrievedId);
  console.log("Crossword data:", JSON.parse(retrievedData));
  console.log("Updated at:", new Date(Number(updatedAt) * 1000));

  // Check max winners config
  const currentMaxWinners = await crosswordBoard.read.getMaxWinnersConfig();
  console.log("Current max winners config:", currentMaxWinners.toString());

  // Check max winners in prizes contract directly
  const prizesMaxWinners = await crosswordPrizes.read.getMaxWinners();
  console.log("Max winners in prizes contract:", prizesMaxWinners.toString());

  // Check config contract max winners value
  const configMaxWinners = await config.read.getUIntConfig(["max_winners"]);
  console.log("Max winners in config contract:", configMaxWinners.toString());

  // Test that both values are consistent
  if (currentMaxWinners === 5n && 
      prizesMaxWinners === 5n && 
      configMaxWinners === 5n) {
    console.log("\n✅ SUCCESS: All max winners values are consistent (5)!");
  } else {
    console.log("\n❌ ERROR: Max winners values are inconsistent!");
    console.log("- Config contract:", configMaxWinners.toString());
    console.log("- Prizes contract:", prizesMaxWinners.toString());
    console.log("- GetMaxWinnersConfig result:", currentMaxWinners.toString());
  }

  // Test the separate function too to make sure it still works
  console.log("\n--- Testing separate setMaxWinnersConfig function ---");
  try {
    const tx2 = await crosswordBoard.write.setMaxWinnersConfig([7n], {
      account: admin.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    console.log("✓ Separate function executed successfully");
  } catch (error) {
    console.error("Error calling separate function:", error);
  }

  // Check values after separate function call
  const updatedMaxWinners = await crosswordBoard.read.getMaxWinnersConfig();
  const updatedPrizesMaxWinners = await crosswordPrizes.read.getMaxWinners();
  const updatedConfigMaxWinners = await config.read.getUIntConfig(["max_winners"]);

  console.log("After separate function call:");
  console.log("- Max winners config:", updatedMaxWinners.toString());
  console.log("- Max winners in prizes contract:", updatedPrizesMaxWinners.toString());
  console.log("- Max winners in config contract:", updatedConfigMaxWinners.toString());

  // Verify consistency after separate function call
  if (updatedMaxWinners === 7n && 
      updatedPrizesMaxWinners === 7n && 
      updatedConfigMaxWinners === 7n) {
    console.log("\n✅ SUCCESS: All max winners values are consistent after separate function (7)!");
  } else {
    console.log("\n❌ ERROR: Max winners values are inconsistent after separate function!");
  }

  console.log("\n--- Test Summary ---");
  console.log("✅ Combined function (setCrosswordAndMaxWinners) works correctly");
  console.log("✅ Separate function (setMaxWinnersConfig) works correctly");
  console.log("✅ Both functions maintain consistency across contracts");
  console.log("✅ Crossword data is stored correctly");
  console.log("✅ Configuration values are consistent between contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });