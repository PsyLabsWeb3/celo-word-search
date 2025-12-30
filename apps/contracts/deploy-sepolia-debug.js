// SPDX-License-Identifier: MIT
// Final deployment script for Celo Sepolia
async function main() {
  // Import ethers and run from hardhat
  const { ethers, run } = require("hardhat");

  console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");

  // Get deployer from signers
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`\nDeployer address: ${deployerAddress}`);

  // Deploy individual contracts
  console.log("\n1. Deploying CrosswordCore...");
  const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(deployerAddress);
  await crosswordCore.waitForDeployment();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.getAddress()}`);

  console.log("\n2. Deploying CrosswordPrizes_debug...");
  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes_debug");
  const crosswordPrizes = await CrosswordPrizes.deploy(deployerAddress);
  await crosswordPrizes.waitForDeployment();
  console.log(`✅ CrosswordPrizes_debug deployed at: ${await crosswordPrizes.getAddress()}`);

  console.log("\n3. Deploying UserProfiles...");
  const UserProfiles = await ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(deployerAddress);
  await userProfiles.waitForDeployment();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.getAddress()}`);

  console.log("\n4. Deploying ConfigManager...");
  const ConfigManager = await ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(deployerAddress);
  await configManager.waitForDeployment();
  console.log(`✅ ConfigManager deployed at: ${await configManager.getAddress()}`);

  console.log("\n5. Deploying AdminManager...");
  const AdminManager = await ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(deployerAddress);
  await adminManager.waitForDeployment();
  console.log(`✅ AdminManager deployed at: ${await adminManager.getAddress()}`);

  console.log("\n6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = await ethers.getContractFactory("PublicCrosswordManager");
  const publicCrosswordManager = await PublicCrosswordManager.deploy(deployerAddress);
  await publicCrosswordManager.waitForDeployment();
  console.log(`✅ PublicCrosswordManager deployed at: ${await publicCrosswordManager.getAddress()}`);

  // Deploy CrosswordBoard to coordinate all contracts
  console.log("\n7. Deploying CrosswordBoard_debug (coordinator)...");
  const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard_debug");
  const crosswordBoard = await CrosswordBoard.deploy(
    await crosswordCore.getAddress(),
    await crosswordPrizes.getAddress(),
    await userProfiles.getAddress(),
    await configManager.getAddress(),
    await adminManager.getAddress(),
    await publicCrosswordManager.getAddress()
  );
  await crosswordBoard.waitForDeployment();
  console.log(`✅ CrosswordBoard_debug deployed at: ${await crosswordBoard.getAddress()}`);

  // Log deployment addresses
  console.log("\n📋 Complete Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes_debug:   ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard_debug:    ${await crosswordBoard.getAddress()}`);

  // Configuration steps after deployment
  console.log("\n🔧 Configuring contracts after deployment...");

  // 1. Grant admin role to deployer on AdminManager
  console.log("\n   a) Adding deployer as admin to AdminManager...");
  await adminManager.addAdmin(deployerAddress);
  console.log("   ✅ Deployer added as admin to AdminManager");

  // 2. Grant admin roles to deployer on other contracts
  console.log("\n   b) Granting admin roles to deployer...");
  const adminRole = await crosswordPrizes.DEFAULT_ADMIN_ROLE();
  await crosswordPrizes.grantRole(adminRole, deployerAddress);
  console.log("   ✅ Admin role granted to deployer on CrosswordPrizes");

  // 3. Grant OPERATOR role to CrosswordBoard on CrosswordPrizes
  console.log("\n   c) Granting OPERATOR role to CrosswordBoard on CrosswordPrizes...");
  const operatorRole = "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"; // OPERATOR_ROLE
  await crosswordPrizes.grantRole(operatorRole, await crosswordBoard.getAddress());
  console.log("   ✅ OPERATOR role granted to CrosswordBoard on CrosswordPrizes");

  // 4. Allow native CELO in CrosswordPrizes
  console.log("\n   d) Allowing native CELO in CrosswordPrizes...");
  await crosswordPrizes.setAllowedToken("0x0000000000000000000000000000000000000000", true);
  console.log("   ✅ Native CELO allowed in CrosswordPrizes");

  // 5. Set max winners if needed
  console.log("\n   e) Configuring max winners...");
  const currentMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log(`   📊 Current max winners: ${currentMaxWinners}`);
  if (currentMaxWinners < 10) {
    await crosswordPrizes.setMaxWinners(10);
    console.log("   ✅ Max winners updated to 10");
  }

  // 6. Set signer for CrosswordCore (using deployer as initial signer)
  console.log("\n   f) Setting signer for CrosswordCore...");
  await crosswordCore.setSigner(deployerAddress);
  console.log("   ✅ Signer set for CrosswordCore");

  console.log("\n✅ All contracts deployed and configured successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
