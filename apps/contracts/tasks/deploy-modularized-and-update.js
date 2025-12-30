// SPDX-License-Identifier: MIT
// Deployment script for Celo Sepolia using Hardhat task
const { task } = require("hardhat/config");
const { keccak256, toHex } = require("viem");

task("deploy-modularized-and-update", "Deploys all modularized crossword contracts to Celo Sepolia and updates frontend config")
  .setAction(async (taskArgs, hre) => {
    console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");

    // Get deployer from signers using the HRE passed in
    const [deployer] = await hre.viem.getWalletClients();
    const deployerAddress = deployer.account.address;
    console.log(`\nDeployer address: ${deployerAddress}`);

    // Deploy individual contracts using viem
    console.log("\n1. Deploying CrosswordCore...");
    const CrosswordCore = await hre.viem.deployContract("CrosswordCore", [deployerAddress]);
    console.log(`✅ CrosswordCore deployed at: ${CrosswordCore.address}`);

    console.log("\n2. Deploying CrosswordPrizes...");
    const CrosswordPrizes = await hre.viem.deployContract("CrosswordPrizes", [deployerAddress]);
    console.log(`✅ CrosswordPrizes deployed at: ${CrosswordPrizes.address}`);

    console.log("\n3. Deploying UserProfiles...");
    const UserProfiles = await hre.viem.deployContract("UserProfiles", [deployerAddress]);
    console.log(`✅ UserProfiles deployed at: ${UserProfiles.address}`);

    console.log("\n4. Deploying ConfigManager...");
    const ConfigManager = await hre.viem.deployContract("ConfigManager", [deployerAddress]);
    console.log(`✅ ConfigManager deployed at: ${ConfigManager.address}`);

    console.log("\n5. Deploying AdminManager...");
    const AdminManager = await hre.viem.deployContract("AdminManager", [deployerAddress]);
    console.log(`✅ AdminManager deployed at: ${AdminManager.address}`);

    console.log("\n6. Deploying PublicCrosswordManager...");
    const PublicCrosswordManager = await hre.viem.deployContract("PublicCrosswordManager", [deployerAddress]);
    console.log(`✅ PublicCrosswordManager deployed at: ${PublicCrosswordManager.address}`);

    // Deploy CrosswordBoard to coordinate all contracts
    console.log("\n7. Deploying CrosswordBoard (coordinator)...");
    const CrosswordBoard = await hre.viem.deployContract("CrosswordBoard", [
      CrosswordCore.address,
      CrosswordPrizes.address,
      UserProfiles.address,
      ConfigManager.address,
      AdminManager.address,
      PublicCrosswordManager.address
    ]);
    console.log(`✅ CrosswordBoard deployed at: ${CrosswordBoard.address}`);

    // Log deployment addresses
    console.log("\n📋 Complete Deployment Summary:");
    console.log(`CrosswordCore:           ${CrosswordCore.address}`);
    console.log(`CrosswordPrizes:         ${CrosswordPrizes.address}`);
    console.log(`UserProfiles:            ${UserProfiles.address}`);
    console.log(`ConfigManager:           ${ConfigManager.address}`);
    console.log(`AdminManager:            ${AdminManager.address}`);
    console.log(`PublicCrosswordManager:  ${PublicCrosswordManager.address}`);
    console.log(`CrosswordBoard:          ${CrosswordBoard.address}`);

    // Configuration steps after deployment
    console.log("\n🔧 Configuring contracts after deployment...");
    const publicClient = await hre.viem.getPublicClient();

    // 2. Grant admin roles to deployer on other contracts
    console.log("\n   b) Granting admin roles to deployer...");
    const adminRole = keccak256(toHex("ADMIN_ROLE"));
    const grantAdminHash = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.write.grantRole([adminRole, deployerAddress]));
    await publicClient.waitForTransactionReceipt({ hash: grantAdminHash });
    console.log("   ✅ Admin role granted to deployer on CrosswordPrizes");

    // 3. Grant OPERATOR and ADMIN roles to CrosswordBoard on CrosswordPrizes
    console.log("\n   c) Granting OPERATOR & ADMIN roles to CrosswordBoard on CrosswordPrizes...");
    const operatorRole = keccak256(toHex("OPERATOR_ROLE"));
    const grantOperatorHash = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.write.grantRole([operatorRole, CrosswordBoard.address]));
    await publicClient.waitForTransactionReceipt({ hash: grantOperatorHash });
    const grantAdminHashForBoard = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.write.grantRole([adminRole, CrosswordBoard.address]));
    await publicClient.waitForTransactionReceipt({ hash: grantAdminHashForBoard });
    console.log("   ✅ OPERATOR & ADMIN roles granted to CrosswordBoard on CrosswordPrizes");

    // 4. Allow native CELO in CrosswordPrizes
    console.log("\n   d) Allowing native CELO in CrosswordPrizes...");
    const allowTokenHash = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.write.setAllowedToken(["0x0000000000000000000000000000000000000000", true]));
    await publicClient.waitForTransactionReceipt({ hash: allowTokenHash });
    console.log("   ✅ Native CELO allowed in CrosswordPrizes");

    // 5. Set max winners if needed
    console.log("\n   e) Configuring max winners...");
    const currentMaxWinners = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.read.getMaxWinners());
    console.log(`   📊 Current max winners: ${currentMaxWinners}`);
    if (currentMaxWinners < 10n) {
      const setMaxWinnersHash = await hre.viem.getContractAt("CrosswordPrizes", CrosswordPrizes.address).then(prizes => prizes.write.setMaxWinners([10n]));
      await publicClient.waitForTransactionReceipt({ hash: setMaxWinnersHash });
      console.log("   ✅ Max winners updated to 10");
    }

    // 6. Set signer for CrosswordCore (using deployer as initial signer)
    console.log("\n   f) Setting signer for CrosswordCore...");
    const setSignerHash = await hre.viem.getContractAt("CrosswordCore", CrosswordCore.address).then(core => core.write.setSigner([deployerAddress]));
    await publicClient.waitForTransactionReceipt({ hash: setSignerHash });
    console.log("   ✅ Signer set for CrosswordCore");

    console.log("\n✅ All contracts deployed and configured successfully!");

    // Update frontend configuration
    console.log("\n🔄 Updating frontend configuration...");
    const fs = require('fs');
    const path = require('path');

    const frontendConfigPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'contracts.ts');
    let configContent = fs.readFileSync(frontendConfigPath, 'utf8');

    // Replace the addresses in the frontend config
    configContent = configContent.replace(
      /CrosswordBoard: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `CrosswordBoard: {\n      address: "${CrosswordBoard.address}"`
    );

    configContent = configContent.replace(
      /CrosswordCore: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `CrosswordCore: {\n      address: "${CrosswordCore.address}"`
    );

    configContent = configContent.replace(
      /CrosswordPrizes: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `CrosswordPrizes: {\n      address: "${CrosswordPrizes.address}"`
    );

    configContent = configContent.replace(
      /UserProfiles: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `UserProfiles: {\n      address: "${UserProfiles.address}"`
    );

    configContent = configContent.replace(
      /ConfigManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `ConfigManager: {\n      address: "${ConfigManager.address}"`
    );

    configContent = configContent.replace(
      /AdminManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `AdminManager: {\n      address: "${AdminManager.address}"`
    );

    configContent = configContent.replace(
      /PublicCrosswordManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/g,
      `PublicCrosswordManager: {\n      address: "${PublicCrosswordManager.address}"`
    );

    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("✅ Frontend configuration updated successfully!\n");

    // Also update the web deployment files
    console.log("🔄 Updating web deployment files...");
    const webDeploymentPath = path.join(__dirname, '..', 'web', 'contracts', 'sepolia-deployment.json');
    if (fs.existsSync(webDeploymentPath)) {
      const webDeployment = JSON.parse(fs.readFileSync(webDeploymentPath, 'utf8'));
      
      // Update addresses while preserving ABI
      if (webDeployment.contracts.CrosswordBoard) {
        webDeployment.contracts.CrosswordBoard.address = CrosswordBoard.address;
      } else {
        webDeployment.contracts.CrosswordBoard = {
          address: CrosswordBoard.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.CrosswordCore) {
        webDeployment.contracts.CrosswordCore.address = CrosswordCore.address;
      } else {
        webDeployment.contracts.CrosswordCore = {
          address: CrosswordCore.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.CrosswordPrizes) {
        webDeployment.contracts.CrosswordPrizes.address = CrosswordPrizes.address;
      } else {
        webDeployment.contracts.CrosswordPrizes = {
          address: CrosswordPrizes.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.UserProfiles) {
        webDeployment.contracts.UserProfiles.address = UserProfiles.address;
      } else {
        webDeployment.contracts.UserProfiles = {
          address: UserProfiles.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.ConfigManager) {
        webDeployment.contracts.ConfigManager.address = ConfigManager.address;
      } else {
        webDeployment.contracts.ConfigManager = {
          address: ConfigManager.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.AdminManager) {
        webDeployment.contracts.AdminManager.address = AdminManager.address;
      } else {
        webDeployment.contracts.AdminManager = {
          address: AdminManager.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      if (webDeployment.contracts.PublicCrosswordManager) {
        webDeployment.contracts.PublicCrosswordManager.address = PublicCrosswordManager.address;
      } else {
        webDeployment.contracts.PublicCrosswordManager = {
          address: PublicCrosswordManager.address,
          abi: [] // Will be populated with actual ABI if needed
        };
      }
      
      fs.writeFileSync(webDeploymentPath, JSON.stringify(webDeployment, null, 2));
      console.log("✅ Web deployment file updated successfully!\n");
    }

    console.log("\n🎉 All contracts deployed, configured, and frontend updated successfully on Celo Sepolia!");
    console.log("\n📋 Final Deployment Summary:");
    console.log(`CrosswordCore:           ${CrosswordCore.address}`);
    console.log(`CrosswordPrizes:         ${CrosswordPrizes.address}`);
    console.log(`UserProfiles:            ${UserProfiles.address}`);
    console.log(`ConfigManager:           ${ConfigManager.address}`);
    console.log(`AdminManager:            ${AdminManager.address}`);
    console.log(`PublicCrosswordManager:  ${PublicCrosswordManager.address}`);
    console.log(`CrosswordBoard:          ${CrosswordBoard.address}`);

    console.log("\n💡 Next steps:");
    console.log("   - Restart your frontend application to use the new contract addresses");
    console.log("   - Test the contracts with the updated functionality");
    console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
    console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
    console.log("   - Winners will receive prizes automatically based on their completion rank");

    return {
      crosswordCore: CrosswordCore.address,
      crosswordPrizes: CrosswordPrizes.address,
      userProfiles: UserProfiles.address,
      configManager: ConfigManager.address,
      adminManager: AdminManager.address,
      publicCrosswordManager: PublicCrosswordManager.address,
      crosswordBoard: CrosswordBoard.address
    };
  });

module.exports = {};