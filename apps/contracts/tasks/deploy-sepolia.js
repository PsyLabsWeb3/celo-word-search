// tasks/deploy-sepolia.js
task("deploy-sepolia", "Deploys all crossword contracts to Sepolia")
  .setAction(async (taskArgs, hre) => {
    const { ethers, run } = hre;
    console.log("🚀 Deploying library-based crossword contracts to Sepolia...");

    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer address: ${await deployer.getAddress()}`);

    // Deploy individual contracts
    console.log("\n1. Deploying CrosswordCore...");
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
    await crosswordCore.waitForDeployment();
    const coreAddress = await crosswordCore.getAddress();
    console.log(`✅ CrosswordCore deployed at: ${coreAddress}`);

    console.log("\n2. Deploying CrosswordPrizes...");
    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    const crosswordPrizes = await CrosswordPrizes.deploy(await deployer.getAddress());
    await crosswordPrizes.waitForDeployment();
    const prizesAddress = await crosswordPrizes.getAddress();
    console.log(`✅ CrosswordPrizes deployed at: ${prizesAddress}`);

    console.log("\n3. Deploying UserProfiles...");
    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    const userProfiles = await UserProfiles.deploy(await deployer.getAddress());
    await userProfiles.waitForDeployment();
    const profilesAddress = await userProfiles.getAddress();
    console.log(`✅ UserProfiles deployed at: ${profilesAddress}`);

    console.log("\n4. Deploying ConfigManager...");
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    const configManager = await ConfigManager.deploy(await deployer.getAddress());
    await configManager.waitForDeployment();
    const configAddress = await configManager.getAddress();
    console.log(`✅ ConfigManager deployed at: ${configAddress}`);

    console.log("\n5. Deploying AdminManager...");
    const AdminManager = await ethers.getContractFactory("AdminManager");
    const adminManager = await AdminManager.deploy(await deployer.getAddress());
    await adminManager.waitForDeployment();
    const adminAddress = await adminManager.getAddress();
    console.log(`✅ AdminManager deployed at: ${adminAddress}`);

    // Deploy CrosswordBoard to coordinate all contracts
    console.log("\n6. Deploying CrosswordBoard (coordinator)...");
    const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
    const crosswordBoard = await CrosswordBoard.deploy(
      coreAddress,
      prizesAddress,
      profilesAddress,
      configAddress,
      adminAddress
    );
    await crosswordBoard.waitForDeployment();
    const boardAddress = await crosswordBoard.getAddress();
    console.log(`✅ CrosswordBoard deployed at: ${boardAddress}`);

    // Log deployment addresses
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
  });

module.exports = {};