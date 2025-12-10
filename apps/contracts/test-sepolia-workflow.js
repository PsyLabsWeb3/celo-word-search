const hre = require("hardhat");
const { parseEther, formatEther } = require("viem");

async function main() {
  console.log("🧪 Starting Full Workflow Test on Celo Sepolia...\n");

  const CONTRACT_ADDRESS = "0x62ADF6a2E788Fbbd66B5da641cAD08Fd96115B8B";
  const ADMIN_ADDRESS = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";

  console.log("📋 Contract Information:");
  console.log(`  - Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`  - Admin Address: ${ADMIN_ADDRESS}\n`);

  // Get contract instance
  const contract = await hre.viem.getContractAt("CrosswordBoard", CONTRACT_ADDRESS);

  // Step 1: Check admin role
  console.log("🔑 Step 1: Verifying Admin Role...");
  const ADMIN_ROLE = await contract.read.ADMIN_ROLE();
  const hasAdminRole = await contract.read.hasRole([ADMIN_ROLE, ADMIN_ADDRESS]);
  console.log(`  - Admin has ADMIN_ROLE: ${hasAdminRole}\n`);

  if (!hasAdminRole) {
    console.log("⚠️  Admin role not set. This needs to be done by the contract owner.");
    console.log("   Run: contract.grantRole(ADMIN_ROLE, '0xA35Dc36B55D9A67c8433De7e790074ACC939f39e')\n");
  }

  // Step 2: Check if native CELO is allowed
  console.log("💰 Step 2: Checking Native CELO Token Status...");
  const isNativeCeloAllowed = await contract.read.allowedTokens(["0x0000000000000000000000000000000000000000"]);
  console.log(`  - Native CELO allowed: ${isNativeCeloAllowed}\n`);

  // Step 3: Get max winners config
  console.log("🏆 Step 3: Checking Max Winners Configuration...");
  const maxWinners = await contract.read.maxWinners();
  console.log(`  - Max winners: ${maxWinners}\n`);

  // Step 4: Get current crossword ID
  console.log("📝 Step 4: Checking Current Crossword...");
  const currentCrosswordId = await contract.read.currentCrosswordId();
  console.log(`  - Current Crossword ID: ${currentCrosswordId}\n`);

  if (currentCrosswordId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
    // Step 5: Get crossword details
    console.log("📊 Step 5: Fetching Crossword Details...");
    const crossword = await contract.read.crosswords([currentCrosswordId]);
    console.log(`  - Token: ${crossword[0]}`);
    console.log(`  - Prize Pool: ${formatEther(crossword[1])} CELO`);
    console.log(`  - State: ${crossword[4]}`);
    console.log(`  - End Time: ${new Date(Number(crossword[3]) * 1000).toISOString()}\n`);

    // Step 6: Get completions
    console.log("👥 Step 6: Fetching Completions...");
    const completions = await contract.read.getCompletions([currentCrosswordId]);
    console.log(`  - Total completions: ${completions.length}`);
    
    if (completions.length > 0) {
      console.log("  - Winners:");
      for (let i = 0; i < Math.min(completions.length, 5); i++) {
        const completion = completions[i];
        const isWinner = await contract.read.isWinner([currentCrosswordId, completion.user]);
        const rank = await contract.read.getUserRank([currentCrosswordId, completion.user]);
        console.log(`    - Rank ${rank}: ${completion.user} (Winner: ${isWinner})`);
      }
    }
    console.log("");

    // Step 7: Check segregated balance
    console.log("💵 Step 7: Checking Segregated CELO Balance...");
    const segregatedBalance = await contract.read.crosswordCeloBalance([currentCrosswordId]);
    console.log(`  - Remaining balance: ${formatEther(segregatedBalance)} CELO\n`);
  } else {
    console.log("ℹ️  No active crossword found. You can create one from the admin panel.\n");
  }

  // Step 8: Check contract balance
  console.log("💰 Step 8: Checking Contract Balance...");
  const publicClient = await hre.viem.getPublicClient();
  const contractBalance = await publicClient.getBalance({ address: CONTRACT_ADDRESS });
  console.log(`  - Total contract balance: ${formatEther(contractBalance)} CELO\n`);

  console.log("✅ Workflow test completed successfully!");
  console.log(`\n🔗 View contract on CeloScan: https://sepolia.celoscan.io/address/${CONTRACT_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
