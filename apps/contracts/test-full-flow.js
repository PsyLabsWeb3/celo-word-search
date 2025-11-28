// Full flow test script for Celo Crossword
// Uses the provided private key to test the complete flow

require('dotenv').config();
const { createWalletClient, http, formatEther, parseEther, keccak256, toBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celoSepolia } = require('viem/chains');

// Use the provided private key
const PRIVATE_KEY = "2bc2fb86828553f6c50d37c7dd75fa1028bc9d5569ceb038bd0b268c58f9e8f1";
const CONTRACT_ADDRESS = "0xFCCF4716FC3d5d1A4ECc22D7EFB3D703dE220802"; // Our updated contract with improved claim UX

// Import the ABI
const fs = require('fs');

async function testFullFlow() {
  console.log("🧪 Starting full crossword flow test...\n");

  // Create wallet client with the provided private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  console.log("🔑 Using account:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http('https://forno.celo-sepolia.celo-testnet.org'),
  });

  // Read ABI from compiled contract
  const abiPath = './artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json';
  const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const abi = contractArtifact.abi;

  console.log("🔗 Contract address:", CONTRACT_ADDRESS);

  try {
    // Get account balance using public client
    const { createPublicClient } = require('viem');
    const publicClient = createPublicClient({
      chain: celoSepolia,
      transport: http('https://forno.celo-sepolia.celo-testnet.org'),
    });

    const balance = await publicClient.getBalance({
      address: account.address,
    });
    console.log("💰 Account balance:", formatEther(balance), "CELO");

    if (balance < parseEther('0.1')) {
      console.log("⚠️  Warning: Low balance. You may need more CELO for gas fees and prizes.");
    }

    // 1. Set a crossword
    console.log("\n📝 Step 1: Setting a crossword...");
    const crosswordId = keccak256(toBytes('test-crossword-' + Date.now()));
    const crosswordData = JSON.stringify({
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

    console.log("📋 Crossword ID:", crosswordId);
    console.log("📋 Crossword data:", crosswordData.substring(0, 100) + "...");

    // Prepare and send transaction to set crossword
    const hash1 = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'setCrossword',
      args: [crosswordId, crosswordData],
    });

    console.log("✅ Crossword set! Transaction:", hash1);

    // Wait for transaction to be mined
    const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
    console.log("✅ Transaction confirmed at block:", receipt1.blockNumber);

    // 2. Create crossword with native CELO prize pool
    console.log("\n💰 Step 2: Creating crossword with prizes...");

    const prizePool = parseEther('0.1'); // 0.1 CELO prize pool
    const winnerPercentages = [6000, 3000, 1000]; // 60%, 30%, 10% (in basis points)
    const endTime = 0n; // No deadline
    const maxWinners = 3n;

    const hash2 = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'createCrosswordWithNativeCELO',
      args: [crosswordId, prizePool, winnerPercentages, endTime],
      value: prizePool, // Send the prize pool amount
    });

    console.log("✅ Crossword with prizes created! Transaction:", hash2);
    console.log("   Prize Pool:", formatEther(prizePool), "CELO");
    console.log("   Winner splits:", winnerPercentages.map(p => `${p/100}%`).join(", "));

    // Wait for transaction to be mined
    const receipt2 = await publicClient.waitForTransactionReceipt({ hash: hash2 });
    console.log("✅ Transaction confirmed at block:", receipt2.blockNumber);

    // 3. Complete the crossword (as the same user - for testing purposes)
    console.log("\n🎯 Step 3: Completing the crossword...");

    // Calculate completion duration (in milliseconds)
    const durationMs = 300000n; // 5 minutes in ms

    const hash3 = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'completeCrossword',
      args: [durationMs, "testuser", "Test User", "https://example.com/pfp.jpg"],
    });

    console.log("✅ Crossword completed! Transaction:", hash3);

    // Wait for transaction to be mined
    const receipt3 = await publicClient.waitForTransactionReceipt({ hash: hash3 });
    console.log("✅ Transaction confirmed at block:", receipt3.blockNumber);

    // 4. Try to claim prize (this should work for the first finisher)
    console.log("\n🎁 Step 4: Attempting to claim prize...");

    try {
      const hash4 = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'claimPrize',
        args: [crosswordId],
      });

      console.log("🎉 Prize claimed successfully! Transaction:", hash4);

      // Wait for transaction to be mined
      const receipt4 = await publicClient.waitForTransactionReceipt({ hash: hash4 });
      console.log("✅ Transaction confirmed at block:", receipt4.blockNumber);
    } catch (error) {
      console.log("❌ Could not claim prize:", error.message);

      // This is expected if the user was already rewarded automatically during completion
      if (error.message.includes("already claimed")) {
        console.log("ℹ️  This is expected - the first completer may have been rewarded automatically.");
      }
    }

    // 5. Get current crossword details
    console.log("\n📊 Step 5: Fetching crossword details...");

    const crosswordDetails = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'getCrosswordDetails',
      args: [crosswordId],
    });

    console.log("📋 Crossword details:");
    console.log("   Token:", crosswordDetails[0]); // token address
    console.log("   Prize Pool:", formatEther(crosswordDetails[1]), "CELO");
    console.log("   Winner Percentages:", crosswordDetails[2].map(p => `${Number(p)/100}%`));
    console.log("   Completions (winners):", crosswordDetails[3].length);
    console.log("   Activation Time:", new Date(Number(crosswordDetails[4]) * 1000).toISOString());
    console.log("   State:", crosswordDetails[6]); // 0=Inactive, 1=Active, 2=Complete

    // Show winner details
    if (crosswordDetails[3].length > 0) {
      console.log("🏆 Winners:");
      crosswordDetails[3].forEach((winner, index) => {
        console.log(`   #${index + 1}: ${winner.user} at ${new Date(Number(winner.timestamp) * 1000).toISOString()}, rank ${Number(winner.rank)}`);
      });
    } else {
      console.log("   No winners recorded yet");
    }

    console.log("\n🎉 Full flow test completed successfully!");
    console.log("✅ Set crossword, created with prizes, completed, and attempted to claim");

  } catch (error) {
    console.error("❌ Error during test:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    if (error.shortMessage) {
      console.error("Short message:", error.shortMessage);
    }
  }
}

// Run the test
testFullFlow()
  .then(() => {
    console.log("\n✅ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });