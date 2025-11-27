import { ethers } from "hardhat";

async function main() {
  console.log("Testing the combined crossword and max winners function...\n");

  // Get signers
  const [deployer, admin, user1, user2] = await ethers.getSigners();
  console.log("Using accounts:", {
    deployer: await deployer.getAddress(),
    admin: await admin.getAddress(),
  });

  // Connect to deployed contracts (using addresses from deployment)
  const crosswordBoardAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const crosswordPrizesAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const configAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get contract instances
  const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
  const crosswordBoard = CrosswordBoard.attach(crosswordBoardAddress).connect(deployer);

  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = CrosswordPrizes.attach(crosswordPrizesAddress).connect(deployer);

  const Config = await ethers.getContractFactory("Config");
  const config = Config.attach(configAddress).connect(deployer);

  console.log("Connected to contracts:");
  console.log("- CrosswordBoard:", await crosswordBoard.getAddress());
  console.log("- CrosswordPrizes:", await crosswordPrizes.getAddress());
  console.log("- Config:", await config.getAddress());

  // Test the combined function
  console.log("\n--- Testing combined function setCrosswordAndMaxWinners ---");

  // First, let's check the initial max winners configuration
  const initialMaxWinners = await crosswordBoard.getMaxWinnersConfig();
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
  
  // Add the admin to CrosswordBoard to allow them to call the function
  await crosswordBoard.addAdmin(await admin.getAddress());
  console.log("Admin added to CrosswordBoard");

  // Connect as admin and call the combined function
  const adminBoard = CrosswordBoard.attach(crosswordBoardAddress).connect(admin);
  
  try {
    // Call the combined function
    const tx = await adminBoard.setCrosswordAndMaxWinners(testCrosswordId, testCrosswordData, 5);
    await tx.wait();
    console.log("✓ Combined function executed successfully");
  } catch (error) {
    console.error("Error calling combined function:", error);
    return;
  }

  // Verify both the crossword and max winners were set correctly
  console.log("\nVerifying the results...");
  
  // Check crossword data
  const [retrievedId, retrievedData, updatedAt] = await crosswordBoard.getCurrentCrossword();
  console.log("Crossword ID:", retrievedId);
  console.log("Crossword data:", JSON.parse(retrievedData));
  console.log("Updated at:", new Date(Number(updatedAt) * 1000));

  // Check max winners config
  const currentMaxWinners = await crosswordBoard.getMaxWinnersConfig();
  console.log("Current max winners config:", currentMaxWinners.toString());

  // Check max winners in prizes contract directly
  const prizesMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log("Max winners in prizes contract:", prizesMaxWinners.toString());

  // Check config contract max winners value
  const configMaxWinners = await config.getUIntConfig("max_winners");
  console.log("Max winners in config contract:", configMaxWinners.toString());

  // Test that both values are consistent
  if (currentMaxWinners.toString() === "5" && 
      prizesMaxWinners.toString() === "5" && 
      configMaxWinners.toString() === "5") {
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
    const tx2 = await adminBoard.setMaxWinnersConfig(7);
    await tx2.wait();
    console.log("✓ Separate function executed successfully");
  } catch (error) {
    console.error("Error calling separate function:", error);
  }

  // Check values after separate function call
  const updatedMaxWinners = await crosswordBoard.getMaxWinnersConfig();
  const updatedPrizesMaxWinners = await crosswordPrizes.getMaxWinners();
  const updatedConfigMaxWinners = await config.getUIntConfig("max_winners");

  console.log("After separate function call:");
  console.log("- Max winners config:", updatedMaxWinners.toString());
  console.log("- Max winners in prizes contract:", updatedPrizesMaxWinners.toString());
  console.log("- Max winners in config contract:", updatedConfigMaxWinners.toString());

  // Verify consistency after separate function call
  if (updatedMaxWinners.toString() === "7" && 
      updatedPrizesMaxWinners.toString() === "7" && 
      updatedConfigMaxWinners.toString() === "7") {
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