// Script to test specific functions that UI might call
require("dotenv").config();
const { ethers } = require("ethers");

async function testUIFunctions() {
  console.log("🔍 Testing UI functions on Celo Sepolia...");
  
  // Get RPC URL and private key from environment
  const rpcUrl = process.env.CELO_SEPOLIA_RPC || "https://forno.celo-sepolia.celo-testnet.org";
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in environment");
    return;
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Using address: ${wallet.address}`);
  
  // Contract addresses
  const addresses = {
    crosswordBoard: "0xA84d5f024f5EC2B9e892c48C30De45C0F6b85625",
  };

  try {
    // Load contract ABI
    const CrosswordBoardABI = require('./artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json').abi;

    // Connect to contract
    const crosswordBoard = new ethers.Contract(addresses.crosswordBoard, CrosswordBoardABI, wallet);

    console.log("\n📋 Testing function: createPublicCrosswordWithNativeCELOPrizePool...");
    
    // Test with sample parameters (these would normally come from the UI)
    // Function signature: createPublicCrosswordWithNativeCELOPrizePool(bytes32 crosswordId, string memory name, string memory crosswordData, string memory sponsoredBy, uint256 prizePool, uint256 maxWinners, uint256[] memory prizeDistribution, uint256 deadline)
    try {
      // This is a test call with sample parameters - it will likely fail due to invalid data, but should not fail due to function not existing
      const sampleCrosswordId = "0x" + "1".repeat(64); // 32-byte hex string
      const sampleName = "Test Crossword";
      const sampleData = '{"grid":[["","",""],["","",""],["","",""]],"clues":{"across":[],"down":[]}}';
      const sampleSponsor = "Test Sponsor";
      const prizePool = ethers.parseEther("1"); // 1 CELO
      const maxWinners = 5n;
      const prizeDistribution = [5000n, 3000n, 2000n]; // 50%, 30%, 20% (in basis points)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now

      console.log("Attempting to estimate gas for function call...");
      
      // Estimate gas to see if function exists and parameters are correct
      const gasEstimate = await crosswordBoard.createPublicCrosswordWithNativeCELOPrizePool.estimateGas(
        sampleCrosswordId,
        sampleName,
        sampleData,
        sampleSponsor,
        prizePool,
        maxWinners,
        prizeDistribution,
        deadline,
        { value: prizePool } // Include value for native CELO
      );
      
      console.log(`✅ Gas estimation successful: ${gasEstimate.toString()} gas`);
      console.log("Function exists and parameters are correct");
    } catch (error) {
      if (error.message.includes("function does not exist") || error.message.includes("not found")) {
        console.log(`❌ Function does not exist: ${error.message}`);
      } else if (error.message.includes("revert") || error.message.includes("execution")) {
        console.log(`⚠️ Function exists but would revert with test parameters (expected for invalid test data): ${error.message}`);
      } else {
        console.log(`⚠️ Function exists but gas estimation failed: ${error.message}`);
      }
    }

    console.log("\n📋 Testing function: createPublicCrossword...");
    try {
      const sampleCrosswordId = "0x" + "2".repeat(64);
      const sampleName = "Test Crossword 2";
      const sampleData = '{"grid":[["","",""],["","",""],["","",""]],"clues":{"across":[],"down":[]}}';
      const sampleSponsor = "Test Sponsor 2";

      const gasEstimate = await crosswordBoard.createPublicCrossword.estimateGas(
        sampleCrosswordId,
        sampleName,
        sampleData,
        sampleSponsor
      );
      
      console.log(`✅ createPublicCrossword gas estimation: ${gasEstimate.toString()} gas`);
    } catch (error) {
      console.log(`⚠️ createPublicCrossword error: ${error.message}`);
    }

    console.log("\n📋 Testing function: createPublicCrosswordWithPrizePool...");
    try {
      const sampleCrosswordId = "0x" + "3".repeat(64);
      const sampleName = "Test Crossword 3";
      const sampleData = '{"grid":[["","",""],["","",""],["","",""]],"clues":{"across":[],"down":[]}}';
      const sampleSponsor = "Test Sponsor 3";
      const tokenAddress = "0x0000000000000000000000000000000000000000"; // Native CELO
      const prizePool = ethers.parseEther("0.5");
      const maxWinners = 3n;
      const prizeDistribution = [5000n, 3000n, 2000n];
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      const gasEstimate = await crosswordBoard.createPublicCrosswordWithPrizePool.estimateGas(
        sampleCrosswordId,
        sampleName,
        sampleData,
        sampleSponsor,
        prizePool,
        tokenAddress,
        maxWinners,
        prizeDistribution,
        deadline
      );
      
      console.log(`✅ createPublicCrosswordWithPrizePool gas estimation: ${gasEstimate.toString()} gas`);
    } catch (error) {
      console.log(`⚠️ createPublicCrosswordWithPrizePool error: ${error.message}`);
    }

    console.log("\n📋 Testing read functions...");
    try {
      // Test getCurrentCrossword
      const currentCrossword = await crosswordBoard.getCurrentCrossword();
      console.log(`✅ getCurrentCrossword: ID = ${currentCrossword[0]}`);
    } catch (error) {
      console.log(`❌ getCurrentCrossword error: ${error.message}`);
    }

    try {
      // Test getActivePublicCrosswords
      const activeCrosswords = await crosswordBoard.getActivePublicCrosswordIds();
      console.log(`✅ getActivePublicCrosswordIds: ${activeCrosswords.length} crosswords`);
    } catch (error) {
      console.log(`❌ getActivePublicCrosswordIds error: ${error.message}`);
    }

    console.log("\n✅ UI function testing completed!");
    
  } catch (error) {
    console.error("❌ UI function testing failed:", error);
  }
}

testUIFunctions();