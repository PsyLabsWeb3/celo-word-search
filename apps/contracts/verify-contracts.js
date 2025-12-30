// Script to verify contracts on CeloScan
require("dotenv").config();
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Contract addresses from the successful deployment
const contractAddresses = {
  crosswordCore: "0xcCfD51a9ee142Cb3a68e1cB07B60cAd569b2b309",
  crosswordPrizes: "0x69b6eFb2D48430c4FDC8f363e36359029C437d11",
  userProfiles: "0x4C3A7A93209668D77Cc4d734E1cF9B0700Aa779F",
  configManager: "0x30EB569228DC341A7e1c7B70920a268464Bf3483",
  adminManager: "0x0BBeEe782b15854Dbfa022f7b9958471FD970b02",
  publicCrosswordManager: "0x0af0685D18C1C8687943e8F8F6b60EDA96398913",
  crosswordBoard: "0xA84d5f024f5EC2B9e892c48C30De45C0F6b85625"
};

const deployerAddress = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";

async function verifyContract(contractName, address, constructorArguments) {
  console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
  
  const argsString = constructorArguments.map(arg => `"${arg}"`).join(" ");
  const command = `npx hardhat verify --network celoSepolia ${address} ${argsString}`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log(`✅ ${contractName} verified successfully!`);
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`⚠️ ${contractName} already verified on CeloScan`);
    } else {
      console.error(`❌ Failed to verify ${contractName}:`, error.message);
    }
  }
}

async function verifyAllContracts() {
  console.log("🚀 Starting contract verification on CeloScan...");
  
  // Verify individual contracts first
  await verifyContract(
    "CrosswordCore", 
    contractAddresses.crosswordCore, 
    [deployerAddress]
  );
  
  await verifyContract(
    "CrosswordPrizes", 
    contractAddresses.crosswordPrizes, 
    [deployerAddress]
  );
  
  await verifyContract(
    "UserProfiles", 
    contractAddresses.userProfiles, 
    [deployerAddress]
  );
  
  await verifyContract(
    "ConfigManager", 
    contractAddresses.configManager, 
    [deployerAddress]
  );
  
  await verifyContract(
    "AdminManager", 
    contractAddresses.adminManager, 
    [deployerAddress]
  );
  
  await verifyContract(
    "PublicCrosswordManager", 
    contractAddresses.publicCrosswordManager, 
    [deployerAddress]
  );
  
  // Verify the main coordinator contract last
  await verifyContract(
    "CrosswordBoard", 
    contractAddresses.crosswordBoard, 
    [
      contractAddresses.crosswordCore,
      contractAddresses.crosswordPrizes,
      contractAddresses.userProfiles,
      contractAddresses.configManager,
      contractAddresses.adminManager,
      contractAddresses.publicCrosswordManager
    ]
  );
  
  console.log("\n🎉 Contract verification process completed!");
  console.log("\n📋 Final Deployment & Verification Summary:");
  console.log(`CrosswordCore:           ${contractAddresses.crosswordCore}`);
  console.log(`CrosswordPrizes:         ${contractAddresses.crosswordPrizes}`);
  console.log(`UserProfiles:            ${contractAddresses.userProfiles}`);
  console.log(`ConfigManager:           ${contractAddresses.configManager}`);
  console.log(`AdminManager:            ${contractAddresses.adminManager}`);
  console.log(`PublicCrosswordManager:  ${contractAddresses.publicCrosswordManager}`);
  console.log(`CrosswordBoard:          ${contractAddresses.crosswordBoard}`);
  console.log(`\nDeployer:                ${deployerAddress}`);
  
  console.log("\n💡 Next steps:");
  console.log("   - Check the contracts on CeloScan: https://sepolia.celoscan.io/");
  console.log("   - Test the contracts with the updated functionality");
  console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
  console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
  console.log("   - Winners will receive prizes automatically based on their completion rank");
}

verifyAllContracts()
  .then(() => {
    console.log("\n✅ Verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });