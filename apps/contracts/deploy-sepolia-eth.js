const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying modular crossword contracts to Ethereum Sepolia...\\n");

  // Get deployer from signers
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`Deployer address: ${deployerAddress}\\n`);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH\\n`);
  
  if (balance == 0n) {
    console.error("❌ Deployer has no ETH! Please fund the account before deployment.");
    process.exit(1);
  }

  // Deploy individual contracts
  console.log("1. Deploying CrosswordCore...");
  const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
  const crosswordCore = await CrosswordCore.deploy(deployerAddress);
  await crosswordCore.deploymentTransaction().wait();
  console.log(`✅ CrosswordCore deployed at: ${await crosswordCore.getAddress()}\\n`);

  console.log("2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = await hre.ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(deployerAddress);
  await crosswordPrizes.deploymentTransaction().wait();
  console.log(`✅ CrosswordPrizes deployed at: ${await crosswordPrizes.getAddress()}\\n`);

  console.log("3. Deploying UserProfiles...");
  const UserProfiles = await hre.ethers.getContractFactory("UserProfiles");
  const userProfiles = await UserProfiles.deploy(deployerAddress);
  await userProfiles.deploymentTransaction().wait();
  console.log(`✅ UserProfiles deployed at: ${await userProfiles.getAddress()}\\n`);

  console.log("4. Deploying ConfigManager...");
  const ConfigManager = await hre.ethers.getContractFactory("ConfigManager");
  const configManager = await ConfigManager.deploy(deployerAddress);
  await configManager.deploymentTransaction().wait();
  console.log(`✅ ConfigManager deployed at: ${await configManager.getAddress()}\\n`);

  console.log("5. Deploying AdminManager...");
  const AdminManager = await hre.ethers.getContractFactory("AdminManager");
  const adminManager = await AdminManager.deploy(deployerAddress);
  await adminManager.deploymentTransaction().wait();
  console.log(`✅ AdminManager deployed at: ${await adminManager.getAddress()}\\n`);

  console.log("6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = await hre.ethers.getContractFactory("PublicCrosswordManager");
  const publicCrosswordManager = await PublicCrosswordManager.deploy(deployerAddress);
  await publicCrosswordManager.deploymentTransaction().wait();
  console.log(`✅ PublicCrosswordManager deployed at: ${await publicCrosswordManager.getAddress()}\\n`);

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
  console.log(`✅ CrosswordBoard deployed at: ${await crosswordBoard.getAddress()}\\n`);

  // Log deployment addresses
  console.log("📋 Complete Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}\\n`);

  // Configuration steps after deployment
  console.log("🔧 Configuring contracts after deployment...\\n");

  // 1. Add deployer as admin to AdminManager
  console.log("   a) Adding deployer as admin to AdminManager...");
  await adminManager.addAdmin(deployerAddress);
  console.log("   ✅ Deployer added as admin to AdminManager\\n");

  // 2. Grant admin roles to deployer on other contracts
  console.log("   b) Granting admin roles to deployer...");
  const adminRole = await crosswordPrizes.DEFAULT_ADMIN_ROLE();
  await crosswordPrizes.grantRole(adminRole, deployerAddress);
  console.log("   ✅ Admin role granted to deployer on CrosswordPrizes\\n");

  // 3. Grant OPERATOR role to CrosswordBoard on CrosswordPrizes
  console.log("   c) Granting OPERATOR role to CrosswordBoard on CrosswordPrizes...");
  const operatorRole = await crosswordPrizes.OPERATOR_ROLE();
  await crosswordPrizes.grantRole(operatorRole, await crosswordBoard.getAddress());
  console.log("   ✅ OPERATOR role granted to CrosswordBoard on CrosswordPrizes\\n");

  // 4. Allow native ETH in CrosswordPrizes
  console.log("   d) Allowing native ETH in CrosswordPrizes...");
  await crosswordPrizes.setAllowedToken("0x0000000000000000000000000000000000000000", true);
  console.log("   ✅ Native ETH allowed in CrosswordPrizes\\n");

  // 5. Set max winners if needed
  console.log("   e) Configuring max winners...");
  const currentMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log(`   📊 Current max winners: ${currentMaxWinners}`);
  if (currentMaxWinners < 10) {
    await crosswordPrizes.setMaxWinners(10);
    console.log("   ✅ Max winners updated to 10\\n");
  }

  // 6. Set signer for CrosswordCore (using deployer as initial signer)
  console.log("   f) Setting signer for CrosswordCore...");
  await crosswordCore.setSigner(deployerAddress);
  console.log("   ✅ Signer set for CrosswordCore\\n");

  console.log("✅ All contracts deployed and configured successfully!\\n");

  // Update frontend configuration
  console.log("🔄 Updating frontend configuration...");
  
  const frontendConfigPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'contracts.ts');
  let configContent = fs.readFileSync(frontendConfigPath, 'utf8');
  
  // For Ethereum Sepolia (chainId: 11155111), we need to update the [sepolia.id] section
  // We'll use a more robust approach with regex to find and replace within the sepolia section
  
  const addresses = {
    CrosswordBoard: await crosswordBoard.getAddress(),
    CrosswordCore: await crosswordCore.getAddress(),
    CrosswordPrizes: await crosswordPrizes.getAddress(),
    UserProfiles: await userProfiles.getAddress(),
    ConfigManager: await configManager.getAddress(),
    AdminManager: await adminManager.getAddress(),
    PublicCrosswordManager: await publicCrosswordManager.getAddress()
  };

  // Replace addresses in the sepolia.id section
  // This regex finds the pattern for each contract within the sepolia section
  for (const [contractName, address] of Object.entries(addresses)) {
    const regex = new RegExp(
      `(\\[sepolia\\.id\\]:[\\s\\S]*?${contractName}:[\\s\\S]*?address:\\s*["\'])0x[a-fA-F0-9]+(["\'])`,
      'g'
    );
    const replacement = `$1${address}$2`;
    configContent = configContent.replace(regex, replacement);
  }
  
  fs.writeFileSync(frontendConfigPath, configContent);
  console.log("✅ Frontend configuration updated successfully!\\n");

  // Copy ABIs to frontend
  console.log("🔄 Copying ABIs to frontend...");
  
  const abiSourceDir = path.join(__dirname, 'artifacts', 'contracts');
  const abiTargetDir = path.join(__dirname, '..', 'web', 'src', 'lib', 'abis');
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(abiTargetDir)) {
    fs.mkdirSync(abiTargetDir, { recursive: true });
  }

  const contractFiles = [
    'CrosswordBoard.sol/CrosswordBoard.json',
    'CrosswordCore.sol/CrosswordCore.json',
    'CrosswordPrizes.sol/CrosswordPrizes.json',
    'UserProfiles.sol/UserProfiles.json',
    'ConfigManager.sol/ConfigManager.json',
    'AdminManager.sol/AdminManager.json',
    'PublicCrosswordManager.sol/PublicCrosswordManager.json'
  ];

  for (const contractFile of contractFiles) {
    const sourcePath = path.join(abiSourceDir, contractFile);
    const targetFileName = contractFile.split('/')[1]; // Get just the filename
    const targetPath = path.join(abiTargetDir, targetFileName);
    
    if (fs.existsSync(sourcePath)) {
      const contractJson = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      // Save only the ABI part
      fs.writeFileSync(
        targetPath,
        JSON.stringify({ abi: contractJson.abi }, null, 2)
      );
      console.log(`   ✅ Copied ${targetFileName}`);
    } else {
      console.log(`   ⚠️  Source not found: ${contractFile}`);
    }
  }

  console.log("\\n✅ All ABIs copied successfully!\\n");

  // Save deployment info to a JSON file
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: addresses
  };

  const deploymentInfoPath = path.join(__dirname, 'sepolia-deployment.json');
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to ${deploymentInfoPath}\\n`);

  console.log("🎉 All contracts deployed, configured, ABIs copied, and frontend updated successfully on Ethereum Sepolia!");
  console.log("\\n📋 Final Deployment Summary:");
  console.log(`CrosswordCore:           ${await crosswordCore.getAddress()}`);
  console.log(`CrosswordPrizes:         ${await crosswordPrizes.getAddress()}`);
  console.log(`UserProfiles:            ${await userProfiles.getAddress()}`);
  console.log(`ConfigManager:           ${await configManager.getAddress()}`);
  console.log(`AdminManager:            ${await adminManager.getAddress()}`);
  console.log(`PublicCrosswordManager:  ${await publicCrosswordManager.getAddress()}`);
  console.log(`CrosswordBoard:          ${await crosswordBoard.getAddress()}`);

  console.log("\\n💡 Next steps:");
  console.log("   - Restart your frontend application to use the new contract addresses");
  console.log("   - Test the contracts with the updated functionality");
  console.log("   - Create crosswords using CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool");
  console.log("   - Users can complete crosswords using CrosswordBoard.completeCrossword");
  console.log("   - Winners will receive prizes automatically based on their completion rank");
  
  // Verify contracts on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\\n🔍 Verifying contracts on Etherscan...");
    console.log("⏳ Waiting 30 seconds for Etherscan to index the contracts...\\n");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const contractsToVerify = [
      { name: 'CrosswordCore', address: await crosswordCore.getAddress(), args: [deployerAddress] },
      { name: 'CrosswordPrizes', address: await crosswordPrizes.getAddress(), args: [deployerAddress] },
      { name: 'UserProfiles', address: await userProfiles.getAddress(), args: [deployerAddress] },
      { name: 'ConfigManager', address: await configManager.getAddress(), args: [deployerAddress] },
      { name: 'AdminManager', address: await adminManager.getAddress(), args: [deployerAddress] },
      { name: 'PublicCrosswordManager', address: await publicCrosswordManager.getAddress(), args: [deployerAddress] },
      {
        name: 'CrosswordBoard',
        address: await crosswordBoard.getAddress(),
        args: [
          await crosswordCore.getAddress(),
          await crosswordPrizes.getAddress(),
          await userProfiles.getAddress(),
          await configManager.getAddress(),
          await adminManager.getAddress(),
          await publicCrosswordManager.getAddress()
        ]
      }
    ];

    for (const contract of contractsToVerify) {
      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: contract.args,
        });
        console.log(`✅ ${contract.name} verified on Etherscan`);
      } catch (error) {
        console.log(`⚠️  ${contract.name} verification failed or already verified:`, error.message);
      }
    }
  } else {
    console.log("\\n⚠️  ETHERSCAN_API_KEY not set, skipping contract verification");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
