// Deployment script that bypasses Hardhat's runtime issues
// Uses artifacts and direct ethers.js deployment

require("dotenv").config();
const { ethers } = require("ethers");

// Load contract artifacts (these are compiled by Hardhat)
function getContractArtifact(contractName) {
  try {
    return require(`./artifacts/contracts/${contractName}.sol/${contractName}.json`);
  } catch (error) {
    console.error(`Failed to load artifact for ${contractName}:`, error.message);
    return null;
  }
}

async function deployContracts() {
  console.log("🚀 Deploying complete modular crossword contracts to Celo Sepolia...");
  
  // Get RPC URL and private key from environment
  const rpcUrl = process.env.CELO_SEPOLIA_RPC || "https://forno.celo-sepolia.celo-testnet.org";
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in environment");
    return;
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deployer address: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
  
  if (balance <= ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment!");
    return;
  }

  // Get contract artifacts
  const crosswordCoreArtifact = getContractArtifact("CrosswordCore");
  const crosswordPrizesArtifact = getContractArtifact("CrosswordPrizes");
  const userProfilesArtifact = getContractArtifact("UserProfiles");
  const configManagerArtifact = getContractArtifact("ConfigManager");
  const adminManagerArtifact = getContractArtifact("AdminManager");
  const publicCrosswordManagerArtifact = getContractArtifact("PublicCrosswordManager");
  const crosswordBoardArtifact = getContractArtifact("CrosswordBoard");
  
  if (!crosswordCoreArtifact || !crosswordPrizesArtifact || !userProfilesArtifact || 
      !configManagerArtifact || !adminManagerArtifact || !publicCrosswordManagerArtifact || 
      !crosswordBoardArtifact) {
    console.error("❌ Failed to load one or more contract artifacts");
    return;
  }

  // Deploy individual contracts
  console.log("\n1. Deploying CrosswordCore...");
  const CrosswordCore = new ethers.ContractFactory(
    crosswordCoreArtifact.abi,
    crosswordCoreArtifact.bytecode,
    wallet
  );
  const crosswordCore = await CrosswordCore.deploy(wallet.address);
  await crosswordCore.deploymentTransaction().wait();
  const coreAddress = await crosswordCore.getAddress();
  console.log(`✅ CrosswordCore deployed at: ${coreAddress}`);

  console.log("\n2. Deploying CrosswordPrizes...");
  const CrosswordPrizes = new ethers.ContractFactory(
    crosswordPrizesArtifact.abi,
    crosswordPrizesArtifact.bytecode,
    wallet
  );
  const crosswordPrizes = await CrosswordPrizes.deploy(wallet.address);
  await crosswordPrizes.deploymentTransaction().wait();
  const prizesAddress = await crosswordPrizes.getAddress();
  console.log(`✅ CrosswordPrizes deployed at: ${prizesAddress}`);

  console.log("\n3. Deploying UserProfiles...");
  const UserProfiles = new ethers.ContractFactory(
    userProfilesArtifact.abi,
    userProfilesArtifact.bytecode,
    wallet
  );
  const userProfiles = await UserProfiles.deploy(wallet.address);
  await userProfiles.deploymentTransaction().wait();
  const profilesAddress = await userProfiles.getAddress();
  console.log(`✅ UserProfiles deployed at: ${profilesAddress}`);

  console.log("\n4. Deploying ConfigManager...");
  const ConfigManager = new ethers.ContractFactory(
    configManagerArtifact.abi,
    configManagerArtifact.bytecode,
    wallet
  );
  const configManager = await ConfigManager.deploy(wallet.address);
  await configManager.deploymentTransaction().wait();
  const configAddress = await configManager.getAddress();
  console.log(`✅ ConfigManager deployed at: ${configAddress}`);

  console.log("\n5. Deploying AdminManager...");
  const AdminManager = new ethers.ContractFactory(
    adminManagerArtifact.abi,
    adminManagerArtifact.bytecode,
    wallet
  );
  const adminManager = await AdminManager.deploy(wallet.address);
  await adminManager.deploymentTransaction().wait();
  const adminAddress = await adminManager.getAddress();
  console.log(`✅ AdminManager deployed at: ${adminAddress}`);

  console.log("\n6. Deploying PublicCrosswordManager...");
  const PublicCrosswordManager = new ethers.ContractFactory(
    publicCrosswordManagerArtifact.abi,
    publicCrosswordManagerArtifact.bytecode,
    wallet
  );
  const publicCrosswordManager = await PublicCrosswordManager.deploy(wallet.address);
  await publicCrosswordManager.deploymentTransaction().wait();
  const publicMgrAddress = await publicCrosswordManager.getAddress();
  console.log(`✅ PublicCrosswordManager deployed at: ${publicMgrAddress}`);

  // Deploy CrosswordBoard to coordinate all contracts
  console.log("\n7. Deploying CrosswordBoard (coordinator)...");
  const CrosswordBoard = new ethers.ContractFactory(
    crosswordBoardArtifact.abi,
    crosswordBoardArtifact.bytecode,
    wallet
  );
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
}

// Run the deployment
deployContracts()
  .then((result) => {
    if (result) {
      console.log("\n🎉 All contracts deployed successfully on Celo Sepolia!");
      console.log("\n📋 Final Deployment Summary:");
      console.log(`CrosswordCore:           ${result.crosswordCore}`);
      console.log(`CrosswordPrizes:         ${result.crosswordPrizes}`);
      console.log(`UserProfiles:            ${result.userProfiles}`);
      console.log(`ConfigManager:           ${result.configManager}`);
      console.log(`AdminManager:            ${result.adminManager}`);
      console.log(`PublicCrosswordManager:  ${result.publicCrosswordManager}`);
      console.log(`CrosswordBoard:          ${result.crosswordBoard}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });