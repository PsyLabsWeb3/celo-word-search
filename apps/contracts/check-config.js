// Script to check all contract configurations in detail
require("dotenv").config();
const { ethers } = require("ethers");

async function checkDetailedConfiguration() {
  console.log("🔍 Checking detailed contract configuration on Celo Sepolia...");
  
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
    const PublicCrosswordManagerABI = require('./artifacts/contracts/PublicCrosswordManager.sol/PublicCrosswordManager.json').abi;

    // Connect to contracts
    const crosswordBoard = new ethers.Contract(addresses.crosswordBoard, CrosswordBoardABI, wallet);
    const crosswordCore = new ethers.Contract(addresses.crosswordCore, CrosswordCoreABI, wallet);
    const crosswordPrizes = new ethers.Contract(addresses.crosswordPrizes, CrosswordPrizesABI, wallet);
    const publicCrosswordManager = new ethers.Contract(addresses.publicCrosswordManager, PublicCrosswordManagerABI, wallet);

    console.log("\n📋 Checking CrosswordBoard configuration...");
    try {
      const coreAddr = await crosswordBoard.crosswordCore();
      const prizesAddr = await crosswordBoard.crosswordPrizes();
      const profilesAddr = await crosswordBoard.userProfiles();
      const configAddr = await crosswordBoard.configManager();
      const adminAddr = await crosswordBoard.adminManager();
      const publicMgrAddr = await crosswordBoard.publicCrosswordManager();
      
      console.log(`✅ CrosswordCore: ${coreAddr}`);
      console.log(`✅ CrosswordPrizes: ${prizesAddr}`);
      console.log(`✅ UserProfiles: ${profilesAddr}`);
      console.log(`✅ ConfigManager: ${configAddr}`);
      console.log(`✅ AdminManager: ${adminAddr}`);
      console.log(`✅ PublicCrosswordManager: ${publicMgrAddr}`);
    } catch (error) {
      console.log(`❌ Error reading CrosswordBoard configuration: ${error.message}`);
    }

    console.log("\n📋 Checking CrosswordCore configuration...");
    try {
      const signer = await crosswordCore.signer();
      console.log(`✅ Signer: ${signer}`);
    } catch (error) {
      console.log(`❌ Error reading CrosswordCore configuration: ${error.message}`);
    }

    console.log("\n📋 Checking CrosswordPrizes configuration...");
    try {
      const maxWinners = await crosswordPrizes.getMaxWinners();
      const nativeToken = "0x0000000000000000000000000000000000000000";
      const isAllowed = await crosswordPrizes.allowedTokens(nativeToken);
      console.log(`✅ Max winners: ${maxWinners}`);
      console.log(`✅ Native CELO allowed: ${isAllowed}`);
    } catch (error) {
      console.log(`❌ Error reading CrosswordPrizes configuration: ${error.message}`);
    }

    console.log("\n📋 Checking PublicCrosswordManager configuration...");
    try {
      // Check if it's paused
      const isPaused = await publicCrosswordManager.paused();
      console.log(`✅ Is paused: ${isPaused}`);
      
      // Check owner/admin
      const owner = await publicCrosswordManager.owner();
      console.log(`✅ Owner: ${owner}`);
    } catch (error) {
      console.log(`❌ Error reading PublicCrosswordManager configuration: ${error.message}`);
    }

    console.log("\n📋 Checking admin roles...");
    try {
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const OPERATOR_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
      
      const boardDefaultRole = await crosswordBoard.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);
      const boardOperatorRole = await crosswordBoard.hasRole(OPERATOR_ROLE, wallet.address);
      const prizesDefaultRole = await crosswordPrizes.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);
      const prizesOperatorRole = await crosswordPrizes.hasRole(OPERATOR_ROLE, wallet.address);
      const publicMgrOwner = await publicCrosswordManager.owner();
      const publicMgrOwnerIsWallet = publicMgrOwner.toLowerCase() === wallet.address.toLowerCase();
      
      console.log(`✅ Wallet has DEFAULT_ADMIN_ROLE in CrosswordBoard: ${boardDefaultRole}`);
      console.log(`✅ Wallet has OPERATOR_ROLE in CrosswordBoard: ${boardOperatorRole}`);
      console.log(`✅ Wallet has DEFAULT_ADMIN_ROLE in CrosswordPrizes: ${prizesDefaultRole}`);
      console.log(`✅ Wallet has OPERATOR_ROLE in CrosswordPrizes: ${prizesOperatorRole}`);
      console.log(`✅ Wallet is owner of PublicCrosswordManager: ${publicMgrOwnerIsWallet}`);
    } catch (error) {
      console.log(`❌ Error checking admin roles: ${error.message}`);
    }

    console.log("\n📋 Testing basic read operations...");
    try {
      // Try to read current crossword
      const currentCrossword = await crosswordBoard.getCurrentCrossword();
      console.log(`✅ Current crossword ID: ${currentCrossword[0]}`);
    } catch (error) {
      console.log(`❌ Error reading current crossword: ${error.message}`);
    }

    console.log("\n✅ Detailed configuration check completed!");
    
  } catch (error) {
    console.error("❌ Detailed configuration check failed:", error);
  }
}

checkDetailedConfiguration();