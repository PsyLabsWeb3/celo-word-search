// Script to fix contract configuration
require("dotenv").config();
const { ethers } = require("ethers");

async function fixContractConfiguration() {
  console.log("🔧 Fixing contract configuration on Celo Sepolia...");
  
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
    const CrosswordCoreABI = require('./artifacts/contracts/CrosswordCore.sol/CrosswordCore.json').abi;
    const CrosswordPrizesABI = require('./artifacts/contracts/CrosswordPrizes.sol/CrosswordPrizes.json').abi;

    // Connect to contracts
    const crosswordCore = new ethers.Contract(addresses.crosswordCore, CrosswordCoreABI, wallet);
    const crosswordPrizes = new ethers.Contract(addresses.crosswordPrizes, CrosswordPrizesABI, wallet);

    console.log("\n🔧 Setting signer for CrosswordCore...");
    
    // Check current signer
    const currentSigner = await crosswordCore.signer();
    console.log(`Current signer: ${currentSigner}`);
    
    // Set the signer to the deployer address (which should be the same as wallet address)
    if (currentSigner === "0x0000000000000000000000000000000000000000") {
      console.log(`Setting signer to: ${wallet.address}`);
      
      const tx = await crosswordCore.setSigner(wallet.address);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
      
      // Verify the signer was set
      const newSigner = await crosswordCore.signer();
      console.log(`New signer: ${newSigner}`);
      
      if (newSigner.toLowerCase() === wallet.address.toLowerCase()) {
        console.log("✅ Signer successfully set!");
      } else {
        console.log("❌ Signer was not set correctly");
      }
    } else {
      console.log("⚠️ Signer is already set, skipping");
    }

    // Also make sure the wallet has admin role in CrosswordPrizes to call admin functions
    const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
    const hasAdminRole = await crosswordPrizes.hasRole(ADMIN_ROLE, wallet.address);
    
    if (!hasAdminRole) {
      console.log(`\n🔧 Granting OPERATOR role to wallet in CrosswordPrizes...`);
      
      const tx = await crosswordPrizes.grantRole(ADMIN_ROLE, wallet.address);
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
      
      console.log("✅ OPERATOR role granted!");
    } else {
      console.log("\n✅ Wallet already has OPERATOR role in CrosswordPrizes");
    }

    console.log("\n✅ Contract configuration fixes completed!");
    
  } catch (error) {
    console.error("❌ Contract configuration fix failed:", error);
  }
}

fixContractConfiguration();