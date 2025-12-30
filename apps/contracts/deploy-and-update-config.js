const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying modular crossword contracts to Celo Sepolia...\n");

  // Get deployer from signers
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`Deployer address: ${deployerAddress}\n`);

  // Deploy individual contracts
  console.log("1. Deploying CrosswordCore...");
  const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(deployerAddress);
  await crosswordCore.deploymentTransaction().wait();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.getAddress()}\n`);

  console.log("2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = await hre.ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(deployerAddress);
  await crosswordPrizes.deploymentTransaction().wait();
  console.log(`✅ CrosswordPrizes deployed at: ${await crosswordPrizes.getAddress()}\n`);

  console.log("3. Deploying UserProfiles...");
  const UserProfiles = await hre.ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(deployerAddress);
  await userProfiles.deploymentTransaction().wait();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.getAddress()}\n`);

  console.log("4. Deploying ConfigManager...");
  const ConfigManager = await hre.ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(deployerAddress);
  await configManager.deploymentTransaction().wait();
  console.log(`✅ ConfigManager deployed at: ${await configManager.getAddress()}\n`);

  console.log("5. Deploying AdminManager...");
  const AdminManager = await hre.ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(deployerAddress);
  await adminManager.deploymentTransaction().wait();
  console.log(`✅ AdminManager deployed at: ${await adminManager.getAddress()}\n`);

  console.log("6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = await hre.ethers.getContractFactory("PublicCrosswordManager");
  const publicCrosswordManager = await PublicCrosswordManager.deploy(deployerAddress);
  await publicCrosswordManager.deploymentTransaction().wait();
  console.log(`✅ PublicCrosswordManager deployed at: ${await publicCrosswordManager.getAddress()}\n`);

  // Deploy CrosswordBoard to coordinate all contracts
  console.log("7. Deploying CrosswordBoard (coordinator)...");
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
  console.log(`✅ CrosswordBoard deployed at: ${await crosswordBoard.getAddress()}\n`);

  // Log deployment addresses
  console.log("📋 Complete Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}\n`);

  // Configuration steps after deployment
  console.log("🔧 Configuring contracts after deployment...\n");

  // 1. Add deployer as admin to AdminManager
  console.log("   a) Adding deployer as admin to AdminManager...");
  await adminManager.addAdmin(deployerAddress);
  console.log("   ✅ Deployer added as admin to AdminManager\n");

  // 2. Grant admin roles to deployer on other contracts
  console.log("   b) Granting admin roles to deployer...");
  const adminRole = await crosswordPrizes.DEFAULT_ADMIN_ROLE();
  await crosswordPrizes.grantRole(adminRole, deployerAddress);
  console.log("   ✅ Admin role granted to deployer on CrosswordPrizes\n");

  // 3. Grant OPERATOR role to CrosswordBoard on CrosswordPrizes
  console.log("   c) Granting OPERATOR role to CrosswordBoard on CrosswordPrizes...");
  const operatorRole = await crosswordPrizes.OPERATOR_ROLE();
  await crosswordPrizes.grantRole(operatorRole, await crosswordBoard.getAddress());
  console.log("   ✅ OPERATOR role granted to CrosswordBoard on CrosswordPrizes\n");

  // 4. Allow native CELO in CrosswordPrizes
  console.log("   d) Allowing native CELO in CrosswordPrizes...");
  await crosswordPrizes.setAllowedToken("0x0000000000000000000000000000000000000000", true);
  console.log("   ✅ Native CELO allowed in CrosswordPrizes\n");

  // 5. Set max winners if needed
  console.log("   e) Configuring max winners...");
  const currentMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log(`   📊 Current max winners: ${currentMaxWinners}`);
  if (currentMaxWinners < 10) {
    await crosswordPrizes.setMaxWinners(10);
    console.log("   ✅ Max winners updated to 10\n");
  }

  // 6. Set signer for CrosswordCore (using deployer as initial signer)
  console.log("   f) Setting signer for CrosswordCore...");
  await crosswordCore.setSigner(deployerAddress);
  console.log("   ✅ Signer set for CrosswordCore\n");

  console.log("✅ All contracts deployed and configured successfully!\n");

  // Update frontend configuration
  console.log("🔄 Updating frontend configuration...");
  const fs = require('fs');
  const path = require('path');
  
  const frontendConfigPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'contracts.ts');
  let configContent = fs.readFileSync(frontendConfigPath, 'utf8');
  
  // Replace the addresses in the frontend config
  configContent = configContent.replace(
    /CrosswordBoard: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `CrosswordBoard: {\n      address: "${await crosswordBoard.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /CrosswordCore: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `CrosswordCore: {\n      address: "${await crosswordCore.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /CrosswordPrizes: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `CrosswordPrizes: {\n      address: "${await crosswordPrizes.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /UserProfiles: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `UserProfiles: {\n      address: "${await userProfiles.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /ConfigManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `ConfigManager: {\n      address: "${await configManager.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /AdminManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `AdminManager: {\n      address: "${await adminManager.getAddress()}"`
  );
  
  configContent = configContent.replace(
    /PublicCrosswordManager: \{\s*address: ["']0x[a-fA-F0-9]+["']/,
    `PublicCrosswordManager: {\n      address: "${await publicCrosswordManager.getAddress()}"`
  );
  
  fs.writeFileSync(frontendConfigPath, configContent);
  console.log("✅ Frontend configuration updated successfully!\n");

  // Also update the web deployment files
  console.log("🔄 Updating web deployment files...");
  const webDeploymentPath = path.join(__dirname, '..', 'web', 'contracts', 'sepolia-deployment.json');
  if (fs.existsSync(webDeploymentPath)) {
    const webDeployment = JSON.parse(fs.readFileSync(webDeploymentPath, 'utf8'));
    webDeployment.contracts.CrosswordBoard.address = await crosswordBoard.getAddress();
    webDeployment.contracts.CrosswordCore.address = await crosswordCore.getAddress();
    webDeployment.contracts.CrosswordPrizes.address = await crosswordPrizes.getAddress();
    webDeployment.contracts.UserProfiles.address = await userProfiles.getAddress();
    webDeployment.contracts.ConfigManager.address = await configManager.getAddress();
    webDeployment.contracts.AdminManager.address = await adminManager.getAddress();
    webDeployment.contracts.PublicCrosswordManager.address = await publicCrosswordManager.getAddress();
    fs.writeFileSync(webDeploymentPath, JSON.stringify(webDeployment, null, 2));
    console.log("✅ Web deployment file updated successfully!\n");
  }

  console.log("🎉 All contracts deployed, configured, and frontend updated successfully on Celo Sepolia!");
  console.log("\n📋 Final Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}`);

  console.log("\n💡 Next steps:");
  console.log("   - Restart your frontend application to use the new contract addresses");
  console.log("   - Test the contracts with the updated functionality");
  console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
  console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
  console.log("   - Winners will receive prizes automatically based on their completion rank");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });