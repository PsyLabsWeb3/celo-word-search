// Test script to verify contract configuration
require("dotenv").config();
const { ethers } = require("ethers");

async function testContractConfiguration() {
  console.log("🔍 Testing contract configuration on Celo Sepolia...");
  
  // Get RPC URL and private key from environment
  const rpcUrl = process.env.CELO_SEPOLIA_RPC || "https://forno.celo-sepolia.celo-testnet.org";
  const privateKey = process.env.PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY or SIGNER_PRIVATE_KEY not found in environment");
    return;
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Using address: ${wallet.address}`);
  
  // Contract addresses
  const addresses = {
    crosswordBoard: "0xA84d5f024f5EC2B9e892c48C30De45C0F6b85625",
    crosswordCore: "0xcCfD51a9ee142Cb3a68e1cB07B60cAd569b2b309",
    crosswordPrizes: "0x69b6eFb2D48430c4FDC8f363e36359029C437d11",
    userProfiles: "0x4C3A7A93209668D77Cc4d734E1cF9B0700Aa779F",
    configManager: "0x30EB569228DC341A7e1c7B70920a268464Bf3483",
    adminManager: "0x0BBeEe782b15854Dbfa022f7b9958471FD970b02",
    publicCrosswordManager: "0x0af0685D18C1C8687943e8F8F6b60EDA96398913"
  };

  try {
    // Load contract ABIs
    const CrosswordBoardABI = require('./artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json').abi;
    const CrosswordCoreABI = require('./artifacts/contracts/CrosswordCore.sol/CrosswordCore.json').abi;
    const CrosswordPrizesABI = require('./artifacts/contracts/CrosswordPrizes.sol/CrosswordPrizes.json').abi;

    // Connect to contracts
    const crosswordBoard = new ethers.Contract(addresses.crosswordBoard, CrosswordBoardABI, wallet);
    const crosswordCore = new ethers.Contract(addresses.crosswordCore, CrosswordCoreABI, wallet);
    const crosswordPrizes = new ethers.Contract(addresses.crosswordPrizes, CrosswordPrizesABI, wallet);

    // Test basic reads
    console.log("\n📋 Testing basic contract reads...");
    
    // Check if contracts have proper references
    try {
      const coreAddress = await crosswordBoard.crosswordCore();
      console.log(`✅ CrosswordCore address in CrosswordBoard: ${coreAddress}`);
    } catch (error) {
      console.log(`❌ Error reading CrosswordCore address: ${error.message}`);
    }
    
    try {
      const prizesAddress = await crosswordBoard.crosswordPrizes();
      console.log(`✅ CrosswordPrizes address in CrosswordBoard: ${prizesAddress}`);
    } catch (error) {
      console.log(`❌ Error reading CrosswordPrizes address: ${error.message}`);
    }

    // Check signer in CrosswordCore
    try {
      const signer = await crosswordCore.signer();
      console.log(`✅ Signer in CrosswordCore: ${signer}`);
    } catch (error) {
      console.log(`❌ Error reading signer: ${error.message}`);
    }

    // Check admin roles
    try {
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const hasRole = await crosswordPrizes.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);
      console.log(`✅ Wallet has DEFAULT_ADMIN_ROLE in CrosswordPrizes: ${hasRole}`);
    } catch (error) {
      console.log(`❌ Error checking admin role: ${error.message}`);
    }

    // Check max winners
    try {
      const maxWinners = await crosswordPrizes.getMaxWinners();
      console.log(`✅ Max winners configured: ${maxWinners}`);
    } catch (error) {
      console.log(`❌ Error reading max winners: ${error.message}`);
    }

    // Check if native CELO is allowed
    try {
      const nativeToken = "0x0000000000000000000000000000000000000000";
      const isAllowed = await crosswordPrizes.allowedTokens(nativeToken);
      console.log(`✅ Native CELO allowed in CrosswordPrizes: ${isAllowed}`);
    } catch (error) {
      console.log(`❌ Error checking native CELO allowance: ${error.message}`);
    }

    console.log("\n✅ Contract configuration test completed!");
    
  } catch (error) {
    console.error("❌ Contract configuration test failed:", error);
  }
}

testContractConfiguration();