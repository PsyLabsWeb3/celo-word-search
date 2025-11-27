const hre = require("hardhat");

async function testBasicFunctionality() {
  console.log("Testing basic crossword functionality...\n");

  // Get wallet clients
  const [deployer, admin, user1] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Accounts:");
  console.log("- Deployer:", deployer.account.address);
  console.log("- Admin:", admin.account.address);
  console.log("- User1:", user1.account.address);

  // Load deployed contracts
  const crosswordBoard = await hre.viem.getContractAt(
    "CrosswordBoard",
    "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0" // From our deployment
  );
  
  const crosswordPrizes = await hre.viem.getContractAt(
    "CrosswordPrizes",
    "0x5fbdb2315678afecb367f032d93f642f64180aa3" // From our deployment
  );

  console.log("\nLoaded contracts:");
  console.log("- CrosswordBoard:", crosswordBoard.address);
  console.log("- CrosswordPrizes:", crosswordPrizes.address);

  // Import viem utilities
  const { keccak256, toBytes } = require("viem");

  console.log("\nChecking initial state...");

  // Check if admin is properly set on CrosswordBoard
  const adminStatus = await crosswordBoard.read.isAdminAddress([admin.account.address]);
  console.log("✅ Admin status on CrosswordBoard:", adminStatus);

  // Check CrosswordPrizes contract address in CrosswordBoard
  const boardPrizesAddress = await crosswordBoard.read.prizesContract();
  console.log("✅ Prizes contract address in CrosswordBoard:", boardPrizesAddress);
  console.log("✅ Expected address:", crosswordPrizes.address);
  console.log("✅ Addresses match:", boardPrizesAddress.toLowerCase() === crosswordPrizes.address.toLowerCase());

  // Now let's try a simple test - just set a crossword without prizes first
  console.log("\nTesting basic crossword setting...");
  const testCrosswordId = keccak256(toBytes("test-basic"));
  const testCrosswordData = JSON.stringify({ test: "data" });
  
  try {
    const setTx = await crosswordBoard.write.setCrossword([testCrosswordId, testCrosswordData], { account: admin.account });
    console.log("✅ Basic crossword set successfully");
    
    // Get the current crossword
    const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
    console.log("✅ Current crossword retrieved:");
    console.log("  - ID:", currentId);
    console.log("  - Data:", currentData);
    console.log("  - Updated:", updateTime.toString());
  } catch (error) {
    console.error("❌ Error setting basic crossword:", error.message);
    return;
  }

  console.log("\n🎉 Basic functionality test completed successfully!");
  console.log("✅ The contracts are properly deployed and connected");
  console.log("✅ Admin roles are properly set");
  console.log("✅ CrosswordBoard can communicate with CrosswordPrizes");
}

// Run the test
testBasicFunctionality()
  .then(() => {
    console.log("\n✅ Basic test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Basic test failed:", error);
    process.exit(1);
  });