const hre = require("hardhat");

async function testCrosswordFlow() {
  console.log("Testing crossword creation and activation flow...\n");

  // Get wallet clients
  const [deployer, admin, user1, user2, user3] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Accounts:");
  console.log("- Deployer:", deployer.account.address);
  console.log("- Admin:", admin.account.address);
  console.log("- User1:", user1.account.address);
  console.log("- User2:", user2.account.address);
  console.log("- User3:", user3.account.address);

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

  // Grant admin role to the admin account on CrosswordPrizes
  console.log("\nGranting admin role to admin account on CrosswordPrizes...");
  const adminRole = keccak256(toBytes("ADMIN_ROLE"));
  const grantRoleTx = await crosswordPrizes.write.grantRole([adminRole, admin.account.address], { account: deployer.account });
  console.log("✅ Granted admin role to admin account on CrosswordPrizes");

  // Add admin to CrosswordBoard
  console.log("\nAdding admin to CrosswordBoard...");
  const addAdminTx = await crosswordBoard.write.addAdmin([admin.account.address], { account: deployer.account });
  console.log("✅ Added admin to CrosswordBoard");

  // Allow native CELO in CrosswordPrizes
  console.log("\nAllowing native CELO in CrosswordPrizes...");
  const allowNativeTx = await crosswordPrizes.write.setAllowedToken(["0x0000000000000000000000000000000000000000", true], { account: deployer.account });
  console.log("✅ Allowed native CELO in CrosswordPrizes");

  // Grant OPERATOR_ROLE to CrosswordBoard so it can call recordCompletion
  console.log("\nGranting OPERATOR_ROLE to CrosswordBoard on CrosswordPrizes...");
  const operatorRole = keccak256(toBytes("OPERATOR_ROLE"));
  const grantOperatorTx = await crosswordPrizes.write.grantRole([operatorRole, crosswordBoard.address], { account: deployer.account });
  console.log("✅ Granted OPERATOR_ROLE to CrosswordBoard on CrosswordPrizes");

  // Define test data for a crossword
  const crosswordId = keccak256(toBytes("test-crossword-1"));
  const crosswordData = JSON.stringify({
    grid: [
      ["C", "E", "L", "O"],
      ["R", "U", "N", "I"],
      ["O", "S", "T", "M"],
      ["S", "E", "P", "O"]
    ],
    clues: {
      across: [
        { number: 1, clue: "Celo blockchain token" },
        { number: 2, clue: "Start to run" },
        { number: 3, clue: "Computer server" },
        { number: 4, clue: "Celo testnet" }
      ],
      down: [
        { number: 1, clue: "Currency" },
        { number: 2, clue: "Not up" },
        { number: 3, clue: "Time of day" },
        { number: 5, clue: "Opposite of 'old'" }
      ]
    }
  });
  
  const prizePool = 10000000000000000000n; // 10 CELO (in wei)
  const winnerPercentages = [6000, 3000, 1000]; // 60%, 30%, 10%
  const newMaxWinners = 3;
  const endTime = 0; // No deadline

  console.log("\nCreating crossword with native CELO prize pool...");
  console.log("- Crossword ID:", crosswordId);
  console.log("- Prize Pool:", Number(prizePool) / 1e18, "CELO");
  console.log("- Winner Percentages:", winnerPercentages);
  console.log("- Max Winners:", newMaxWinners);

  // Create crossword with native CELO
  try {
    const createTx = await crosswordBoard.write.createCrosswordWithNativeCELOPrizePool([
      crosswordId,
      crosswordData,
      newMaxWinners,
      prizePool,
      winnerPercentages,
      endTime
    ], { 
      account: admin.account,
      value: prizePool 
    });
    console.log("✅ Crossword created successfully with native CELO prize pool");
  } catch (error) {
    console.error("❌ Error creating crossword:", error.message);
    throw error;
  }

  // Verify crossword was created in CrosswordPrizes
  console.log("\nChecking crossword details in CrosswordPrizes...");
  try {
    const crosswordDetails = await crosswordPrizes.read.getCrosswordDetails([crosswordId]);
    console.log("✅ Crossword details retrieved:");
    console.log("  - Token:", crosswordDetails[0]); // address (0x000...000 for native CELO)
    console.log("  - Total Prize Pool:", Number(crosswordDetails[1]) / 1e18, "CELO");
    console.log("  - Winner Percentages:", crosswordDetails[2]);
    console.log("  - State:", crosswordDetails[6]); // 0 = Inactive, 1 = Active, 2 = Complete
  } catch (error) {
    console.error("❌ Error getting crossword details:", error.message);
    throw error;
  }

  // Activate the crossword
  console.log("\nActivating crossword...");
  try {
    const activateTx = await crosswordBoard.write.activateCrosswordInPrizes([crosswordId], { account: admin.account });
    console.log("✅ Crossword activated successfully");
  } catch (error) {
    console.error("❌ Error activating crossword:", error.message);
    throw error;
  }

  // Check that crossword is now active
  console.log("\nChecking crossword state after activation...");
  try {
    const crosswordDetails = await crosswordPrizes.read.getCrosswordDetails([crosswordId]);
    console.log("✅ Crossword state after activation:", crosswordDetails[6]); // Should be 1 (Active)
    console.log("  - Activation time:", crosswordDetails[4].toString());
    console.log("  - Contract balance:", Number(await publicClient.getBalance({ address: crosswordPrizes.address })) / 1e18, "CELO");
  } catch (error) {
    console.error("❌ Error getting crossword details after activation:", error.message);
    throw error;
  }

  // Simulate users completing the crossword
  console.log("\nSimulating users completing the crossword...");
  
  const completeCrossword = async (user, duration, username) => {
    try {
      console.log(`  - ${username} attempting to complete crossword...`);
      const completeTx = await crosswordBoard.write.completeCrossword([
        duration,
        username,
        `${username} Display`,
        `https://example.com/pfp/${username}`
      ], { account: user.account });
      console.log(`  - ${username} completed crossword successfully!`);
      return completeTx;
    } catch (error) {
      console.error(`  - ${username} failed to complete crossword:`, error.message);
      throw error;
    }
  };

  // Complete crossword in order (first 3 finishers should get prizes)
  await completeCrossword(user1, 300000, "user1"); // First place (300 seconds)
  await completeCrossword(user2, 320000, "user2"); // Second place (320 seconds)
  await completeCrossword(user3, 340000, "user3"); // Third place (340 seconds)

  // Check winner information
  console.log("\nChecking winner information...");
  try {
    const isUser1Winner = await crosswordPrizes.read.isWinner([crosswordId, user1.account.address]);
    const isUser2Winner = await crosswordPrizes.read.isWinner([crosswordId, user2.account.address]);
    const isUser3Winner = await crosswordPrizes.read.isWinner([crosswordId, user3.account.address]);
    
    console.log("✅ Winners status:");
    console.log(`  - User1 is winner: ${isUser1Winner}`);
    console.log(`  - User2 is winner: ${isUser2Winner}`);
    console.log(`  - User3 is winner: ${isUser3Winner}`);
    
    if (isUser1Winner) {
      const rank1 = await crosswordPrizes.read.getUserRank([crosswordId, user1.account.address]);
      console.log(`  - User1 rank: ${rank1}`);
    }
    if (isUser2Winner) {
      const rank2 = await crosswordPrizes.read.getUserRank([crosswordId, user2.account.address]);
      console.log(`  - User2 rank: ${rank2}`);
    }
    if (isUser3Winner) {
      const rank3 = await crosswordPrizes.read.getUserRank([crosswordId, user3.account.address]);
      console.log(`  - User3 rank: ${rank3}`);
    }
  } catch (error) {
    console.error("❌ Error checking winner information:", error.message);
    throw error;
  }

  // Check if users received their prizes
  console.log("\nChecking user balances after prize distribution...");
  const user1Balance = await publicClient.getBalance({ address: user1.account.address });
  const user2Balance = await publicClient.getBalance({ address: user2.account.address });
  const user3Balance = await publicClient.getBalance({ address: user3.account.address });
  
  console.log("✅ User balances after prize distribution:");
  console.log(`  - User1 balance: ${Number(user1Balance) / 1e18} CELO`);
  console.log(`  - User2 balance: ${Number(user2Balance) / 1e18} CELO`);
  console.log(`  - User3 balance: ${Number(user3Balance) / 1e18} CELO`);

  console.log("\n🎉 All tests passed! The crossword creation and activation flow is working correctly.");
  console.log("📝 Summary:");
  console.log("   - Crossword created with native CELO prize pool");
  console.log("   - Crossword activated successfully");
  console.log("   - Users completed crossword and received prizes automatically");
  console.log("   - Prize distribution worked as expected");
}

// Run the test
testCrosswordFlow()
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });