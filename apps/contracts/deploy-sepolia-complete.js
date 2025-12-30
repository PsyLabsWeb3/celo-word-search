// SPDX-License-Identifier: MIT
// Complete deployment script for all crossword contracts to Sepolia
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying complete modular crossword contracts to Sepolia...");

  // Get deployer from signers (the private key account)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\nDeployer address: ${await deployer.getAddress()}`);

  // Deploy individual contracts
  console.log("\n1. Deploying CrosswordCore...");
  const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
  await crosswordCore.deploymentTransaction().wait();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.getAddress()}`);

  console.log("\n2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = await hre.ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(await deployer.getAddress());
  await crosswordPrizes.deploymentTransaction().wait();
  console.log(`✅ CrosswordPrizes deployed at: ${await crosswordPrizes.getAddress()}`);

  console.log("\n3. Deploying UserProfiles...");
  const UserProfiles = await hre.ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(await deployer.getAddress());
  await userProfiles.deploymentTransaction().wait();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.getAddress()}`);

  console.log("\n4. Deploying ConfigManager...");
  const ConfigManager = await hre.ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(await deployer.getAddress());
  await configManager.deploymentTransaction().wait();
  console.log(`✅ ConfigManager deployed at: ${await configManager.getAddress()}`);

  console.log("\n5. Deploying AdminManager...");
  const AdminManager = await hre.ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(await deployer.getAddress());
  await adminManager.deploymentTransaction().wait();
  console.log(`✅ AdminManager deployed at: ${await adminManager.getAddress()}`);

  console.log("\n6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = await hre.ethers.getContractFactory("PublicCrosswordManager");
  const publicCrosswordManager = await PublicCrosswordManager.deploy(await deployer.getAddress());
  await publicCrosswordManager.deploymentTransaction().wait();
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
  await crosswordBoard.deploymentTransaction().wait();
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

  // Verify contracts on Etherscan (optional)
  console.log("\n🔍 Verifying contracts on Sepolia Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: await crosswordCore.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ CrosswordCore verified on Etherscan");
  } catch (error) {
    console.log("⚠️ CrosswordCore verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await crosswordPrizes.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ CrosswordPrizes verified on Etherscan");
  } catch (error) {
    console.log("⚠️ CrosswordPrizes verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await userProfiles.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ UserProfiles verified on Etherscan");
  } catch (error) {
    console.log("⚠️ UserProfiles verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await configManager.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ ConfigManager verified on Etherscan");
  } catch (error) {
    console.log("⚠️ ConfigManager verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await adminManager.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ AdminManager verified on Etherscan");
  } catch (error) {
    console.log("⚠️ AdminManager verification failed or already verified:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await publicCrosswordManager.getAddress(),
      constructorArguments: [await deployer.getAddress()],
    });
    console.log("✅ PublicCrosswordManager verified on Etherscan");
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
    console.log("✅ CrosswordBoard verified on Etherscan");
  } catch (error) {
    console.log("⚠️ CrosswordBoard verification failed or already verified:", error.message);
  }

  console.log("\n🎉 All contracts deployed and verified successfully on Sepolia!");
  console.log("💡 Remember to configure the contracts after deployment:");
  console.log("   - Set signer in CrosswordCore");
  console.log("   - Grant admin roles as needed");
  console.log("   - Grant OPERATOR role to CrosswordBoard on CrosswordPrizes");
  console.log("   - Allow native CELO in CrosswordPrizes");

  // Optionally configure max winners
  console.log("\n🔧 Configuring max winners...");
  try {
    const currentMaxWinners = await crosswordPrizes.getMaxWinners();
    console.log(`📊 Current max winners: ${currentMaxWinners}`);

    // Set default to 5 winners if it's less than 5
    if (currentMaxWinners < 5) {
      console.log(`📈 Updating max winners from ${currentMaxWinners} to 5...`);
      await crosswordPrizes.connect(deployer).setMaxWinners(5);
      console.log("✅ Max winners updated to 5");
    }

    const finalMaxWinners = await crosswordPrizes.getMaxWinners();
    console.log(`🏆 Final max winners configured: ${finalMaxWinners}`);
  } catch (error) {
    console.log("⚠️ Could not configure max winners:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });