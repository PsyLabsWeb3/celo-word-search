// Alternative deployment script using direct ethers.js
// This bypasses Hardhat's signer system which seems to be having issues

const { ethers, network } = require("hardhat");

async function deployContracts() {
  console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");
  console.log("Network:", network.name);

  try {
    // Get signers - this is where the error occurs
    console.log("Getting signers...");
    const signers = await ethers.getSigners();
    console.log("Number of signers:", signers.length);
    
    if (signers.length === 0) {
      console.error("❌ No signers available! Check your private key configuration.");
      return;
    }
    
    const deployer = signers[0];
    const deployerAddress = await deployer.getAddress();
    console.log(`\nDeployer address: ${deployerAddress}`);

    // Check if the deployer has sufficient balance
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
    
    if (balance <= ethers.parseEther("0.01")) { // Check if balance is less than 0.01 CELO
      console.error("❌ Insufficient balance for deployment!");
      return;
    }

    // Deploy individual contracts
    console.log("\n1. Deploying CrosswordCore...");
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    const crosswordCore = await CrosswordCore.deploy(deployerAddress);
    await crosswordCore.deploymentTransaction().wait();
    const coreAddress = await crosswordCore.getAddress();
    console.log(`✅ CrosswordCore deployed at: ${coreAddress}`);

    console.log("\n2. Deploying CrosswordPrizes...");
    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    const crosswordPrizes = await CrosswordPrizes.deploy(deployerAddress);
    await crosswordPrizes.deploymentTransaction().wait();
    const prizesAddress = await crosswordPrizes.getAddress();
    console.log(`✅ CrosswordPrizes deployed at: ${prizesAddress}`);

    console.log("\n3. Deploying UserProfiles...");
    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    const userProfiles = await UserProfiles.deploy(deployerAddress);
    await userProfiles.deploymentTransaction().wait();
    const profilesAddress = await userProfiles.getAddress();
    console.log(`✅ UserProfiles deployed at: ${profilesAddress}`);

    console.log("\n4. Deploying ConfigManager...");
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    const configManager = await ConfigManager.deploy(deployerAddress);
    await configManager.deploymentTransaction().wait();
    const configAddress = await configManager.getAddress();
    console.log(`✅ ConfigManager deployed at: ${configAddress}`);

    console.log("\n5. Deploying AdminManager...");
    const AdminManager = await ethers.getContractFactory("AdminManager");
    const adminManager = await AdminManager.deploy(deployerAddress);
    await adminManager.deploymentTransaction().wait();
    const adminAddress = await adminManager.getAddress();
    console.log(`✅ AdminManager deployed at: ${adminAddress}`);

    console.log("\n6. Deploying PublicCrosswordManager...");
    const PublicCrosswordManager = await ethers.getContractFactory("PublicCrosswordManager");
    const publicCrosswordManager = await PublicCrosswordManager.deploy(deployerAddress);
    await publicCrosswordManager.deploymentTransaction().wait();
    const publicMgrAddress = await publicCrosswordManager.getAddress();
    console.log(`✅ PublicCrosswordManager deployed at: ${publicMgrAddress}`);

    // Deploy CrosswordBoard to coordinate all contracts
    console.log("\n7. Deploying CrosswordBoard (coordinator)...");
    const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
    const crosswordBoard = await CrosswordBoard.deploy(
      coreAddress,
      prizesAddress,
      profilesAddress,
      configAddress,
      adminAddress,
      publicMgrAddress
    );
    await crosswordBoard.deploymentTransaction().wait();
    const boardAddress = await crosswordBoard.getAddress();
    console.log(`✅ CrosswordBoard deployed at: ${boardAddress}`);

    // Log deployment addresses
    console.log("\n📋 Complete Deployment Summary:");
    console.log(`CrosswordCore:           ${coreAddress}`);
    console.log(`CrosswordPrizes:         ${prizesAddress}`);
    console.log(`UserProfiles:            ${profilesAddress}`);
    console.log(`ConfigManager:           ${configAddress}`);
    console.log(`AdminManager:            ${adminAddress}`);
    console.log(`PublicCrosswordManager:  ${publicMgrAddress}`);
    console.log(`CrosswordBoard:          ${boardAddress}`);

    console.log("\n✅ All contracts deployed successfully!");
    
    return {
      crosswordCore: coreAddress,
      crosswordPrizes: prizesAddress,
      userProfiles: profilesAddress,
      configManager: configAddress,
      adminManager: adminAddress,
      publicCrosswordManager: publicMgrAddress,
      crosswordBoard: boardAddress
    };
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run the deployment
deployContracts()
  .then(() => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });