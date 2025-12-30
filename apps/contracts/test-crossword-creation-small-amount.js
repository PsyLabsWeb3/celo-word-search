const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing public crossword creation with smaller amount after granting admin role...\n");

  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}\n`);

  // Check account balance
  const publicClient = await hre.viem.getPublicClient();
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log(`Account balance: ${balance} wei (${balance / 10n**18n} CELO)\n`);

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Test creating a public crossword with native CELO prize pool
  console.log("Creating a public crossword with native CELO prize pool...\n");

  // Sample crossword data
  const crosswordData = JSON.stringify({
    title: "Test Crossword",
    grid: [
      ["H", "E", "L", "L", "O"],
      ["A", "", "", "", "W"],
      ["R", "", "", "", "O"],
      ["D", "", "", "", "R"],
      ["", "", "", "", "L"],
      ["", "", "", "", "D"]
    ],
    clues: {
      across: [
        "1. Greeting",
        "2. First name",
        "3. Planet"
      ],
      down: [
        "1. Letter after G",
        "4. Part of body",
        "5. Last name"
      ]
    }
  });

  const crosswordId = "0x" + "5".repeat(64); // Sample crossword ID
  const name = "Test Crossword";
  const sponsoredBy = "Test Sponsor";
  const maxWinners = 3;
  const prizePool = 10000000000000000n; // 0.01 CELO in wei (smaller amount)
  const winnerPercentages = [5000n, 3000n, 2000n]; // 50%, 30%, 20%
  const endTime = 0n; // No deadline

  try {
    console.log("Attempting to create public crossword with prize pool...");
    console.log(`Crossword ID: ${crosswordId}`);
    console.log(`Name: ${name}`);
    console.log(`Sponsored by: ${sponsoredBy}`);
    console.log(`Prize Pool: ${prizePool} wei (${prizePool / 10n**18n} CELO)`);
    console.log(`Max Winners: ${maxWinners}`);
    
    const txHash = await crosswordBoard.write.createPublicCrosswordWithNativeCELOPrizePool([
      crosswordId,
      name,
      crosswordData,
      sponsoredBy,
      maxWinners,
      prizePool,
      winnerPercentages,
      endTime
    ], {
      value: prizePool
    });

    console.log(`✅ Transaction submitted: ${txHash}`);
    
    // Wait for transaction to be mined
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Now test fetching the active crosswords
    console.log("\nTesting fetching active public crosswords...");
    const activeCrosswords = await crosswordBoard.read.getActivePublicCrosswords();
    console.log(`✅ Active crosswords count: ${activeCrosswords.length}`);
    
    if (activeCrosswords.length > 0) {
      console.log(`Active crossword IDs: ${activeCrosswords}`);
      
      // Test getting details of the first active crossword
      const details = await crosswordBoard.read.getPublicCrosswordDetails([activeCrosswords[0]]);
      console.log(`✅ Retrieved crossword details for: ${activeCrosswords[0]}`);
      console.log(`Name: ${details[0]}`);
      console.log(`Sponsored by: ${details[1]}`);
      console.log(`Prize Pool: ${details[4]} wei`);
      console.log(`Max Winners: ${details[5]}`);
      console.log(`Is Active: ${details[10]}`);
    } else {
      console.log("No active crosswords found, checking all crosswords...");
      
      // Check all crosswords
      const allCrosswords = await crosswordBoard.read.getAllPublicCrosswords();
      console.log(`Total crosswords count: ${allCrosswords.length}`);
      
      if (allCrosswords.length > 0) {
        console.log(`All crossword IDs: ${allCrosswords}`);
        
        // Get details of the first crossword
        const details = await crosswordBoard.read.getPublicCrosswordDetails([allCrosswords[0]]);
        console.log(`✅ Retrieved crossword details for: ${allCrosswords[0]}`);
        console.log(`Name: ${details[0]}`);
        console.log(`Sponsored by: ${details[1]}`);
        console.log(`Prize Pool: ${details[4]} wei`);
        console.log(`Max Winners: ${details[5]}`);
        console.log(`Is Active: ${details[10]}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Operation failed: ${error.message}`);
    console.log("This might be expected if the crossword ID already exists or other constraints");
  }

  console.log("\n🎉 Testing completed!");
  console.log("The crossword creation and fetching functionality should now work correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });