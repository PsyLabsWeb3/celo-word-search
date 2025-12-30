// tasks/deploy-celo-sepolia.js
const { task } = require("hardhat/config");

task("deploy-celo-sepolia", "Deploys all modularized crossword contracts to Celo Sepolia")
  .setAction(async (taskArgs, hre) => {
    const { ethers, run } = hre;
    console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`\nDeployer address: ${deployerAddress}`);

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
    await crosswordPrizes.grantRole(operatorRole, boardAddress);
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
      await run("verify:verify", {
        address: coreAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ CrosswordCore verified on CeloScan");
    } catch (error) {
      console.log("⚠️ CrosswordCore verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: prizesAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ CrosswordPrizes verified on CeloScan");
    } catch (error) {
      console.log("⚠️ CrosswordPrizes verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: profilesAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ UserProfiles verified on CeloScan");
    } catch (error) {
      console.log("⚠️ UserProfiles verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: configAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ ConfigManager verified on CeloScan");
    } catch (error) {
      console.log("⚠️ ConfigManager verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: adminAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ AdminManager verified on CeloScan");
    } catch (error) {
      console.log("⚠️ AdminManager verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: publicMgrAddress,
        constructorArguments: [deployerAddress],
      });
      console.log("✅ PublicCrosswordManager verified on CeloScan");
    } catch (error) {
      console.log("⚠️ PublicCrosswordManager verification failed or already verified:", error.message);
    }

    try {
      await run("verify:verify", {
        address: boardAddress,
        constructorArguments: [
          coreAddress,
          prizesAddress,
          profilesAddress,
          configAddress,
          adminAddress,
          publicMgrAddress
        ],
      });
      console.log("✅ CrosswordBoard verified on CeloScan");
    } catch (error) {
      console.log("⚠️ CrosswordBoard verification failed or already verified:", error.message);
    }

    console.log("\n🎉 All contracts deployed, configured, and verified successfully on Celo Sepolia!");
    console.log("\n📋 Final Deployment Summary:");
    console.log(`CrosswordCore:           ${coreAddress}`);
    console.log(`CrosswordPrizes:         ${prizesAddress}`);
    console.log(`UserProfiles:            ${profilesAddress}`);
    console.log(`ConfigManager:           ${configAddress}`);
    console.log(`AdminManager:            ${adminAddress}`);
    console.log(`PublicCrosswordManager:  ${publicMgrAddress}`);
    console.log(`CrosswordBoard:          ${boardAddress}`);

    console.log("\n💡 Next steps:");
    console.log("   - Test the contracts with the updated functionality");
    console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
    console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
    console.log("   - Winners will receive prizes automatically based on their completion rank");
    
    return {
      crosswordCore: coreAddress,
      crosswordPrizes: prizesAddress,
      userProfiles: profilesAddress,
      configManager: configAddress,
      adminManager: adminAddress,
      publicCrosswordManager: publicMgrAddress,
      crosswordBoard: boardAddress
    };
  });

module.exports = {};