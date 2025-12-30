// scripts/deploy-sepolia.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying library-based crossword contracts to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer address: ${await deployer.getAddress()}`);

  // Deploy individual contracts
  console.log("\n1. Deploying CrosswordCore...");
  const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
  await crosswordCore.waitForDeployment();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.target || await crosswordCore.getAddress()}`);

  console.log("\n2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(await deployer.getAddress());
  await crosswordPrizes.waitForDeployment();
  console.log(`✅ CrosswordPrizes deployed at: ${await crosswordPrizes.target || await crosswordPrizes.getAddress()}`);

  console.log("\n3. Deploying UserProfiles...");
  const UserProfiles = await ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(await deployer.getAddress());
  await userProfiles.waitForDeployment();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.target || await userProfiles.getAddress()}`);

  console.log("\n4. Deploying ConfigManager...");
  const ConfigManager = await ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(await deployer.getAddress());
  await configManager.waitForDeployment();
  console.log(`✅ ConfigManager deployed at: ${await configManager.target || await configManager.getAddress()}`);

  console.log("\n5. Deploying AdminManager...");
  const AdminManager = await ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(await deployer.getAddress());
  await adminManager.waitForDeployment();
  console.log(`✅ AdminManager deployed at: ${await adminManager.target || await adminManager.getAddress()}`);

  // Deploy CrosswordBoard to coordinate all contracts
  console.log("\n6. Deploying CrosswordBoard (coordinator)...");
  const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
  const crosswordBoard = await CrosswordBoard.deploy(
    await crosswordCore.target || await crosswordCore.getAddress(),
    await crosswordPrizes.target || await crosswordPrizes.getAddress(),
    await userProfiles.target || await userProfiles.getAddress(),
    await configManager.target || await configManager.getAddress(),
    await adminManager.target || await adminManager.getAddress()
  );
  await crosswordBoard.waitForDeployment();
  console.log(`✅ CrosswordBoard deployed at: ${await crosswordBoard.target || await crosswordBoard.getAddress()}`);

  // Log deployment addresses
  const coreAddress = await crosswordCore.target || await crosswordCore.getAddress();
  const prizesAddress = await crosswordPrizes.target || await crosswordPrizes.getAddress();
  const profilesAddress = await userProfiles.target || await userProfiles.getAddress();
  const configAddress = await configManager.target || await configManager.getAddress();
  const adminAddress = await adminManager.target || await adminManager.getAddress();
  const boardAddress = await crosswordBoard.target || await crosswordBoard.getAddress();

  console.log("\n📋 Deployment Summary:");
  console.log(`CrosswordCore:      ${coreAddress}`);
  console.log(`CrosswordPrizes:    ${prizesAddress}`);
  console.log(`UserProfiles:       ${profilesAddress}`);
  console.log(`ConfigManager:      ${configAddress}`);
  console.log(`AdminManager:       ${adminAddress}`);
  console.log(`CrosswordBoard:     ${boardAddress}`);

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

  console.log("\n🎉 All contracts deployed successfully on Sepolia!");
  console.log("\n📋 To verify contracts on Etherscan, run these commands:");
  console.log(`npx hardhat verify --network sepolia ${coreAddress} "${await deployer.getAddress()}"`);
  console.log(`npx hardhat verify --network sepolia ${prizesAddress} "${await deployer.getAddress()}"`);
  console.log(`npx hardhat verify --network sepolia ${profilesAddress} "${await deployer.getAddress()}"`);
  console.log(`npx hardhat verify --network sepolia ${configAddress} "${await deployer.getAddress()}"`);
  console.log(`npx hardhat verify --network sepolia ${adminAddress} "${await deployer.getAddress()}"`);
  console.log(`npx hardhat verify --network sepolia ${boardAddress} "${coreAddress}" "${prizesAddress}" "${profilesAddress}" "${configAddress}" "${adminAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });