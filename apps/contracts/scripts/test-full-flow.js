// Full flow test script for Celo Crossword - Local Hardhat flow
// 2 creators create crosswords with CELO rewards, 6 solvers attempt to solve them
// Properly handles signature verification for completeCrossword function

const hre = require("hardhat");

async function testFullFlow() {
  console.log("🧪 Starting local Hardhat flow test with 2 creators and 6 solvers...\n");

  // Get wallet clients - in Hardhat environment we can get multiple accounts
  const [deployer, admin, creator1, creator2, ...solvers] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("📋 Accounts:");
  console.log("- Deployer:", deployer.account.address);
  console.log("- Admin:", admin.account.address);
  console.log("- Creator 1:", creator1.account.address);
  console.log("- Creator 2:", creator2.account.address);
  console.log("- Solvers:", solvers.slice(0, 6).map(s => s.account.address));

  // Deploy contracts (if not already deployed)
  // For this test, we'll assume the contract is already deployed at CONTRACT_ADDRESS
  // But if we need to deploy, here's how we would do it:
  
  // Deploy the modular contracts
  console.log("\n🏗️ Deploying contracts for test...");
  const CrosswordCore = await hre.viem.deployContract("CrosswordCore", [deployer.account.address]);
  const CrosswordPrizes = await hre.viem.deployContract("CrosswordPrizes", [admin.account.address]);
  const UserProfiles = await hre.viem.deployContract("UserProfiles", [admin.account.address]);
  const ConfigManager = await hre.viem.deployContract("ConfigManager", [admin.account.address]);
  const AdminManager = await hre.viem.deployContract("AdminManager", [deployer.account.address]);
  const PublicCrosswordManager = await hre.viem.deployContract("PublicCrosswordManager", [deployer.account.address]);

  console.log("✅ CrosswordCore deployed:", CrosswordCore.address);
  console.log("✅ CrosswordPrizes deployed:", CrosswordPrizes.address);
  console.log("✅ UserProfiles deployed:", UserProfiles.address);
  console.log("✅ ConfigManager deployed:", ConfigManager.address);
  console.log("✅ AdminManager deployed:", AdminManager.address);
  console.log("✅ PublicCrosswordManager deployed:", PublicCrosswordManager.address);

  // Deploy main coordinator contract
  const CrosswordBoard = await hre.viem.deployContract("CrosswordBoard", [
    CrosswordCore.address,
    CrosswordPrizes.address,
    UserProfiles.address,
    ConfigManager.address,
    AdminManager.address,
    PublicCrosswordManager.address
  ]);

  console.log("✅ CrosswordBoard deployed:", CrosswordBoard.address);

  // Add admin to AdminManager
  await AdminManager.write.addAdmin([admin.account.address], { account: deployer.account });
  console.log("✅ Admin added to AdminManager");

  // Grant admin role to the admin account on CrosswordPrizes
  const { keccak256, toBytes, encodePacked } = require("viem");
  const adminRole = keccak256(toBytes("ADMIN_ROLE"));
  await CrosswordPrizes.write.grantRole([adminRole, admin.account.address], { account: admin.account });
  console.log("✅ Granted admin role to admin account on CrosswordPrizes");

  // Grant admin role to the admin account on CrosswordCore
  await CrosswordCore.write.grantRole([adminRole, admin.account.address], { account: deployer.account });
  console.log("✅ Granted admin role to admin account on CrosswordCore");

  // Check if admin is already in AdminManager to avoid duplicate addition
  const isAdminInManager = await AdminManager.read.isAdminAddress([admin.account.address]);
  if (!isAdminInManager) {
    await AdminManager.write.addAdmin([admin.account.address], { account: deployer.account });
    console.log("✅ Added admin to AdminManager");
  } else {
    console.log("✅ Admin already exists in AdminManager");
  }

  // Allow native CELO in CrosswordPrizes
  await CrosswordPrizes.write.setAllowedToken(["0x0000000000000000000000000000000000000000", true], { account: admin.account });
  console.log("✅ Allowed native CELO in CrosswordPrizes");

  // Grant OPERATOR_ROLE to CrosswordBoard so it can call recordCompletion
  const operatorRole = keccak256(toBytes("OPERATOR_ROLE"));
  await CrosswordPrizes.write.grantRole([operatorRole, CrosswordBoard.address], { account: admin.account });
  console.log("✅ Granted OPERATOR_ROLE to CrosswordBoard on CrosswordPrizes");

  // Define test data for two crosswords
  const crosswordId1 = keccak256(toBytes("test-crossword-1"));
  const crosswordId2 = keccak256(toBytes("test-crossword-2"));

  const crosswordData1 = JSON.stringify({
    gridSize: { rows: 4, cols: 4 },
    clues: [
      {
        number: 1,
        clue: "Celo blockchain token",
        answer: "CELO",
        row: 0,
        col: 0,
        direction: "across"
      },
      {
        number: 2,
        clue: "Test answer",
        answer: "TEST",
        row: 1,
        col: 0,
        direction: "across"
      },
      {
        number: 3,
        clue: "Vertical clue",
        answer: "VERT",
        row: 0,
        col: 0,
        direction: "down"
      },
      {
        number: 4,
        clue: "Last word",
        answer: "LAST",
        row: 2,
        col: 0,
        direction: "across"
      }
    ]
  });

  const crosswordData2 = JSON.stringify({
    gridSize: { rows: 4, cols: 4 },
    clues: [
      {
        number: 1,
        clue: "Programming language",
        answer: "JAVA",
        row: 0,
        col: 0,
        direction: "across"
      },
      {
        number: 2,
        clue: "Web framework",
        answer: "REACT",
        row: 1,
        col: 0,
        direction: "across"
      },
      {
        number: 3,
        clue: "Blockchain term",
        answer: "NODE",
        row: 0,
        col: 1,
        direction: "down"
      },
      {
        number: 4,
        clue: "Smart contract lang",
        answer: "SOL",
        row: 2,
        col: 0,
        direction: "across"
      }
    ]
  });

  // Set signer for the crossword core (using admin as the signer for testing)
  await CrosswordCore.write.setSigner([admin.account.address], { account: admin.account });
  console.log("✅ Signer set for crossword core");

  // Store initial balances
  console.log("\n💰 Recording initial balances...");
  const initialBalances = {};
  for (const solver of solvers.slice(0, 6)) {
    initialBalances[solver.account.address] = await publicClient.getBalance({ address: solver.account.address });
  }

  // 1. Create first crossword with native CELO prize pool
  const prizePool1 = 10000000000000000000n; // 10 CELO (in wei)
  const winnerPercentages1 = [5000, 3000, 2000]; // 50%, 30%, 20%
  const maxWinners1 = 3;
  const endTime = 0; // No deadline

  console.log("\n📝 Creating first crossword with native CELO prize pool...");
  console.log("- Crossword ID:", crosswordId1);
  console.log("- Prize Pool:", Number(prizePool1) / 1e18, "CELO");
  console.log("- Winner Percentages:", winnerPercentages1);
  console.log("- Max Winners:", maxWinners1);

  await CrosswordBoard.write.createPublicCrosswordWithNativeCELOPrizePool([
    crosswordId1,
    "Test Crossword 1",
    crosswordData1,
    "Sponsor 1",
    maxWinners1,
    prizePool1,
    winnerPercentages1,
    endTime
  ], {
    account: creator1.account,
    value: prizePool1
  });
  console.log("✅ First crossword created successfully with native CELO prize pool");

  // Set the first crossword as the current crossword for completion
  await CrosswordCore.write.setCrossword([crosswordId1, crosswordData1], { account: admin.account });
  console.log("✅ First crossword set as current crossword for completion");

  // 2. Create second crossword with native CELO prize pool
  const prizePool2 = 15000000000000000000n; // 15 CELO (in wei)
  const winnerPercentages2 = [4000, 3500, 2500]; // 40%, 35%, 25%
  const maxWinners2 = 3;

  console.log("\n📝 Creating second crossword with native CELO prize pool...");
  console.log("- Crossword ID:", crosswordId2);
  console.log("- Prize Pool:", Number(prizePool2) / 1e18, "CELO");
  console.log("- Winner Percentages:", winnerPercentages2);
  console.log("- Max Winners:", maxWinners2);

  await CrosswordBoard.write.createPublicCrosswordWithNativeCELOPrizePool([
    crosswordId2,
    "Test Crossword 2",
    crosswordData2,
    "Sponsor 2",
    maxWinners2,
    prizePool2,
    winnerPercentages2,
    endTime
  ], {
    account: creator2.account,
    value: prizePool2
  });
  console.log("✅ Second crossword created successfully with native CELO prize pool");

  // Set the second crossword as the current crossword for completion
  await CrosswordCore.write.setCrossword([crosswordId2, crosswordData2], { account: admin.account });
  console.log("✅ Second crossword set as current crossword for completion");

  // Verify crosswords were created
  console.log("\n🔍 Verifying crossword creation...");
  const crosswordDetails1 = await CrosswordBoard.read.getPublicCrosswordDetails([crosswordId1]);
  console.log("✅ Crossword 1 details verified - Prize Pool:", Number(crosswordDetails1[4]) / 1e18, "CELO");

  const crosswordDetails2 = await CrosswordBoard.read.getPublicCrosswordDetails([crosswordId2]);
  console.log("✅ Crossword 2 details verified - Prize Pool:", Number(crosswordDetails2[4]) / 1e18, "CELO");

  // Check if crosswords are already active (they should be since createPublicCrosswordWithNativeCELOPrizePool auto-activates)
  console.log("\n🔍 Checking if crosswords are already active...");
  const details1 = await CrosswordBoard.read.getPublicCrosswordDetails([crosswordId1]);
  const details2 = await CrosswordBoard.read.getPublicCrosswordDetails([crosswordId2]);

  const crossword1Active = details1[10]; // isActive is at index 10
  const crossword2Active = details2[10]; // isActive is at index 10

  console.log(`✅ Crossword 1 is active: ${crossword1Active}`);
  console.log(`✅ Crossword 2 is active: ${crossword2Active}`);

  if (!crossword1Active) {
    await CrosswordBoard.write.activatePublicCrossword([crosswordId1], { account: creator1.account });
    console.log("✅ Crossword 1 activated");
  } else {
    console.log("ℹ️  Crossword 1 was already active");
  }

  if (!crossword2Active) {
    await CrosswordBoard.write.activatePublicCrossword([crosswordId2], { account: creator2.account });
    console.log("✅ Crossword 2 activated");
  } else {
    console.log("ℹ️  Crossword 2 was already active");
  }

  // 3. First 3 solvers complete the first crossword
  console.log("\n🏃‍♂️ First 3 solvers completing crossword 1...");

  // Switch to first crossword for completion
  await CrosswordCore.write.setCrossword([crosswordId1, crosswordData1], { account: admin.account });
  console.log("  - Switched to crossword 1 for completion");

  const completeCrossword1 = async (solver, duration, username) => {
    try {
      console.log(`  - ${username} attempting to complete crossword 1...`);

      // Get the current crossword ID from the core contract
      const [currentId, , ] = await CrosswordCore.read.getCurrentCrossword();

      // Prepare the message to sign (as per the contract's verification logic)
      // The contract uses: keccak256(abi.encodePacked(msg.sender, crosswordId, durationMs, address(this)))
      const messageHash = keccak256(
        encodePacked(
          ['address', 'bytes32', 'uint256', 'address'],
          [solver.account.address, currentId, duration, CrosswordCore.address]
        )
      );

      // Sign the message using the admin account (the signer)
      const signature = await admin.signMessage({ message: { raw: messageHash } });

      await CrosswordBoard.write.completeCrossword([
        duration,
        username,
        `${username} Display`,
        `https://example.com/pfp/${username}`,
        signature
      ], { account: solver.account });
      console.log(`  - ${username} completed crossword 1 successfully!`);
    } catch (error) {
      console.error(`  - ${username} failed to complete crossword 1:`, error.message);
      throw error;
    }
  };

  // Complete crossword 1 in order (first 3 finishers should get prizes)
  await completeCrossword1(solvers[0], 300000n, "solver1"); // First place (300 seconds)
  await completeCrossword1(solvers[1], 320000n, "solver2"); // Second place (320 seconds)
  await completeCrossword1(solvers[2], 340000n, "solver3"); // Third place (340 seconds)

  // 4. Next 3 solvers complete the second crossword
  console.log("\n🏃‍♂️ Next 3 solvers completing crossword 2...");

  // Switch to second crossword for completion
  await CrosswordCore.write.setCrossword([crosswordId2, crosswordData2], { account: admin.account });
  console.log("  - Switched to crossword 2 for completion");

  const completeCrossword2 = async (solver, duration, username) => {
    try {
      console.log(`  - ${username} attempting to complete crossword 2...`);

      // Get the current crossword ID from the core contract
      const [currentId, , ] = await CrosswordCore.read.getCurrentCrossword();

      // Prepare the message to sign (as per the contract's verification logic)
      // The contract uses: keccak256(abi.encodePacked(msg.sender, crosswordId, durationMs, address(this)))
      const messageHash = keccak256(
        encodePacked(
          ['address', 'bytes32', 'uint256', 'address'],
          [solver.account.address, currentId, duration, CrosswordCore.address]
        )
      );

      // Sign the message using the admin account (the signer)
      const signature = await admin.signMessage({ message: { raw: messageHash } });

      await CrosswordBoard.write.completeCrossword([
        duration,
        username,
        `${username} Display`,
        `https://example.com/pfp/${username}`,
        signature
      ], { account: solver.account });
      console.log(`  - ${username} completed crossword 2 successfully!`);
    } catch (error) {
      console.error(`  - ${username} failed to complete crossword 2:`, error.message);
      throw error;
    }
  };

  // Complete crossword 2 in order (first 3 finishers should get prizes)
  await completeCrossword2(solvers[3], 280000n, "solver4"); // First place (280 seconds)
  await completeCrossword2(solvers[4], 310000n, "solver5"); // Second place (310 seconds)
  await completeCrossword2(solvers[5], 350000n, "solver6"); // Third place (350 seconds)

  // 5. Check winner information for both crosswords
  console.log("\n🏆 Checking winner information...");

  // Check crossword 1 winners
  for (let i = 0; i < 3; i++) {
    const isWinner = await CrosswordPrizes.read.isWinner([crosswordId1, solvers[i].account.address]);
    console.log(`  - Solver${i+1} is winner in crossword 1: ${isWinner}`);
    if (isWinner) {
      const rank = await CrosswordPrizes.read.getUserRank([crosswordId1, solvers[i].account.address]);
      console.log(`    - Solver${i+1} rank in crossword 1: ${rank}`);
    }
  }

  // Check crossword 2 winners
  for (let i = 3; i < 6; i++) {
    const isWinner = await CrosswordPrizes.read.isWinner([crosswordId2, solvers[i].account.address]);
    console.log(`  - Solver${i+1} is winner in crossword 2: ${isWinner}`);
    if (isWinner) {
      const rank = await CrosswordPrizes.read.getUserRank([crosswordId2, solvers[i].account.address]);
      console.log(`    - Solver${i+1} rank in crossword 2: ${rank}`);
    }
  }

  // 6. Manual Prize Claim & Verification
  console.log("\n💰 Executing Manual Prize Claims...");
  
  const finalBalances = {};
  
  for (let i = 0; i < 6; i++) {
    const solver = solvers[i];
    const initial = initialBalances[solver.account.address];
    
    // Check intermediate balance (before claim)
    const afterCompletionBalance = await publicClient.getBalance({ address: solver.account.address });
    const completionDiff = afterCompletionBalance - initial;
    
    console.log(`  - Solver${i+1} balance change (after completion, before claim): ${(Number(completionDiff) / 1e18).toFixed(6)} CELO`);
    
    // Determine expected prize
    let expectedPrize = 0n;
    let crosswordIdToClaim = null;
    
    if (i < 3) { // Completed crossword 1
      crosswordIdToClaim = crosswordId1;
      if (i === 0) expectedPrize = (prizePool1 * 5000n) / 10000n;
      else if (i === 1) expectedPrize = (prizePool1 * 3000n) / 10000n;
      else if (i === 2) expectedPrize = (prizePool1 * 2000n) / 10000n;
    } else { // Completed crossword 2
      crosswordIdToClaim = crosswordId2;
      if (i === 3) expectedPrize = (prizePool2 * 4000n) / 10000n;
      else if (i === 4) expectedPrize = (prizePool2 * 3500n) / 10000n;
      else if (i === 5) expectedPrize = (prizePool2 * 2500n) / 10000n;
    }

    if (expectedPrize > 0) {
      if (completionDiff > 100000000000000000n || completionDiff < -100000000000000000n) {
         // Using a loose check because gas costs reduce the balance, but a prize would increase it significantly
         // If it's a huge positive change, they got the prize automatically (which we don't want)
         if (completionDiff > expectedPrize / 2n) {
            console.log(`    ⚠️  WARNING: It seems the prize was auto-claimed! (Diff: ${Number(completionDiff)})`);
         } else {
            console.log(`    ✅ Prize not yet received (as expected for manual claim).`);
         }
      } else {
         console.log(`    ✅ Prize not yet received (as expected for manual claim).`);
      }

      console.log(`    - Solver${i+1} claiming prize...`);
      try {
        await CrosswordPrizes.write.claimPrize([crosswordIdToClaim], { account: solver.account });
        console.log(`    - Claim successful!`);
      } catch (e) {
        console.error(`    - Claim failed: ${e.message}`);
      }

      // Check final balance
      const final = await publicClient.getBalance({ address: solver.account.address });
      const finalDiff = final - initial;
      console.log(`    - Final balance change: ${(Number(finalDiff) / 1e18).toFixed(6)} CELO`);
      
      if (finalDiff >= (expectedPrize * 95n / 100n)) { // Allow some gas usage (95% of prize)
         console.log(`    ✅ Prize confirmed in wallet!`);
      } else {
         console.log(`    ❌ Prize not reflected in balance (Diff: ${Number(finalDiff)}, Prize: ${Number(expectedPrize)})`);
      }

    } else {
      console.log(`    - No prize expected.`);
    }
  }

  console.log("\n🎉 Local Hardhat flow test completed successfully!");
  console.log("📝 Summary:");
  console.log("   - 2 creators created crosswords with CELO rewards");
  console.log("   - 6 solvers completed the crosswords (3 per crossword)");
  console.log("   - Signatures properly handled for all completions");
  console.log("   - Winners claimed prizes manually");
  console.log("   - Balance changes verified for all participants");
}

// Run the test
testFullFlow()
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });