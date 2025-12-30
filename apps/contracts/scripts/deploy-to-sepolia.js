// SPDX-License-Identifier: MIT
// Deployment script using Hardhat Runtime Environment directly
require("@nomicfoundation/hardhat-toolbox-viem");

module.exports = async function (hre) {
  console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");

  // Get deployer from signers using the HRE passed in
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`\nDeployer address: ${deployerAddress}`);

  // Deploy individual contracts
  console.log("\n1. Deploying CrosswordCore...");
  const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(deployerAddress);
  await crosswordCore.waitForDeployment();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.getAddress()}`);

  console.log("\n2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = await hre.ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(deployerAddress);
  await crosswordPrizes.waitForDeployment();
  console.log(`✅ CrosswordPrizes deployed at: ${await crosswordPrizes.getAddress()}`);

  console.log("\n3. Deploying UserProfiles...");
  const UserProfiles = await hre.ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(deployerAddress);
  await userProfiles.waitForDeployment();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.getAddress()}`);

  console.log("\n4. Deploying ConfigManager...");
  const ConfigManager = await hre.ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(deployerAddress);
  await configManager.waitForDeployment();
  console.log(`✅ ConfigManager deployed at: ${await configManager.getAddress()}`);

  console.log("\n5. Deploying AdminManager...");
  const AdminManager = await hre.ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(deployerAddress);
  await adminManager.waitForDeployment();
  console.log(`✅ AdminManager deployed at: ${await adminManager.getAddress()}`);

  console.log("\n6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = await hre.ethers.getContractFactory("PublicCrosswordManager");
  const publicCrosswordManager = await PublicCrosswordManager.deploy(deployerAddress);
  await publicCrosswordManager.waitForDeployment();
  console.log(`✅ PublicCrosswordManager deployed at: ${await publicCrosswordManager.getAddress()}`);

  // Deploy CrosswordBoard to coordinate all contracts
  console.log("\n7. Deploying CrosswordBoard (coordinator)...");
  const CrosswordBoard = await hre.ethers.getContractFactory("CrosswordBoard");
  const crosswordBoard = await CrosswordBoard.deploy(
    await crosswordCore.getAddress(),
    await crosswordPrizes.getAddress(),
    await userProfiles.getAddress(),
    await configManager.getAddress(),
    await adminManager.getAddress(),
    await publicCrosswordManager.getAddress()
  );
  await crosswordBoard.waitForDeployment();
  console.log(`✅ CrosswordBoard deployed at: ${await crosswordBoard.getAddress()}`);

  // Log deployment addresses
  console.log("\n📋 Complete Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}`);

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
  const operatorRole = await crosswordPrizes.OPERATOR_ROLE();
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

  // Verify contracts on CeloScan (optional)
  console.log("\n🔍 Verifying contracts on CeloScan...");
  try {
    await hre.run("verify:verify", {
      address: await crosswordCore.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ CrosswordCore verified on CeloScan");
  } catch (error) {
    console.log("⚠️ CrosswordCore verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await crosswordPrizes.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ CrosswordPrizes verified on CeloScan");
  } catch (error) {
    console.log("⚠️ CrosswordPrizes verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await userProfiles.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ UserProfiles verified on CeloScan");
  } catch (error) {
    console.log("⚠️ UserProfiles verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await configManager.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ ConfigManager verified on CeloScan");
  } catch (error) {
    console.log("⚠️ ConfigManager verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await adminManager.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ AdminManager verified on CeloScan");
  } catch (error) {
    console.log("⚠️ AdminManager verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await publicCrosswordManager.getAddress(),
      constructorArguments: [deployerAddress],
    });
    console.log("✅ PublicCrosswordManager verified on CeloScan");
  } catch (error) {
    console.log("⚠️ PublicCrosswordManager verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await crosswordBoard.getAddress(),
      constructorArguments: [
        await crosswordCore.getAddress(),
        await crosswordPrizes.getAddress(),
        await userProfiles.getAddress(),
        await configManager.getAddress(),
        await adminManager.getAddress(),
        await publicCrosswordManager.getAddress()
      ],
    });
    console.log("✅ CrosswordBoard verified on CeloScan");
  } catch (error) {
    console.log("⚠️ CrosswordBoard verification failed or already verified:", error.message);
  }

  console.log("\n🎉 All contracts deployed, configured, and verified successfully on Celo Sepolia!");
  console.log("\n📋 Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}`);
  
  console.log("\n💡 Next steps:");
  console.log("   - Test the contracts with the updated functionality");
  console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
  console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
  console.log("   - Winners will receive prizes automatically based on their completion rank");
};