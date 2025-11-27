// Deployment script for Celo Sepolia - Unified Contract Version
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Celo Sepolia...");

  // Get the viem public client and wallet client
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  if (!deployer) {
    console.error("No deployer account available. Make sure you have set your PRIVATE_KEY in the .env file.");
    process.exit(1);
  }

  console.log("Deploying unified contract with the account:", deployer.account.address);

  // Deploy unified CrosswordBoard contract (now includes all functionality)
  console.log("\nDeploying unified CrosswordBoard...");
  const crosswordBoard = await hre.viem.deployContract("CrosswordBoard", [deployer.account.address]);
  console.log("Unified CrosswordBoard deployed to:", crosswordBoard.address);

  // Add additional admin address
  const additionalAdmin = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

  // Check if additional admin is the same as deployer (which it is in this case)
  console.log("\nChecking if additional admin is deployer...");
  if (deployer.account.address.toLowerCase() === additionalAdmin.toLowerCase()) {
    console.log("Additional admin is the same as deployer - they already have admin rights");
  } else {
    // Add admin to CrosswordBoard using viem contract
    console.log("Adding admin to CrosswordBoard:", additionalAdmin);
    const crosswordBoardContract = await hre.viem.getContractAt("CrosswordBoard", crosswordBoard.address);
    try {
      const addAdminTx = await crosswordBoardContract.write.addAdmin([additionalAdmin], { account: deployer.account });
      console.log("✅ Additional admin added to CrosswordBoard");
    } catch (error) {
      if (error.message.includes("admin already exists")) {
        console.log("⚠️  Admin already exists on CrosswordBoard");
      } else {
        throw error;
      }
    }
  }

  // Grant admin role on the unified contract
  console.log("Granting admin role on unified CrosswordBoard:", additionalAdmin);
  const { keccak256, toBytes } = require("viem");
  const adminRole = keccak256(toBytes("ADMIN_ROLE"));
  try {
    const grantRoleTx = await crosswordBoardContract.write.grantRole([adminRole, additionalAdmin], { account: deployer.account });
    console.log("✅ Admin role granted on unified CrosswordBoard");
  } catch (error) {
    if (error.message.includes("already granted")) {
      console.log("⚠️  Admin role already granted on unified CrosswordBoard");
    } else {
      throw error;
    }
  }

  console.log("✅ Admin setup completed for unified contract");

  // Get contract ABI from artifact
  const crosswordBoardArtifact = await hre.artifacts.readArtifact("CrosswordBoard");
  const crosswordBoardAbi = JSON.stringify(crosswordBoardArtifact.abi);

  // For Sepolia, we'll log the addresses and ABI for manual saving
  console.log("\n" + "=".repeat(50));
  console.log("UNIFIED CONTRACT DEPLOYMENT COMPLETED");
  console.log("=".repeat(50));
  console.log("Unified CrosswordBoard Address:", crosswordBoard.address);
  console.log("\nCrosswordBoard ABI:");
  console.log(JSON.stringify(JSON.parse(crosswordBoardAbi), null, 2));

  // This would be saved to frontend in a real scenario
  console.log("\n" + "=".repeat(50));
  console.log("Next steps:");
  console.log("1. Save this address and ABI to your frontend");
  console.log("2. Update your frontend contract configuration");
  console.log("3. Test on Sepolia network");
  console.log("=".repeat(50));

  // Verify contract (optional, may need API key)
  try {
    console.log("\nAttempting to verify contract...");
    await hre.run("verify:verify", {
      address: crosswordBoard.address,
      constructorArguments: [deployer.account.address],
    });
    console.log("Unified CrosswordBoard verified successfully");
  } catch (error) {
    console.log("Contract verification pending or failed (this is normal for new deployments):", error.message);
  }

  // Get contract ABI for saving to frontend
  const abiArtifacts = await hre.artifacts.readArtifact("CrosswordBoard");

  // Save contract address and ABI to frontend
  console.log("\nSaving contract information to frontend...");
  try {
    // Dynamically require the save script
    const { saveSepoliaDeployment } = require('./save-sepolia-contracts.js');
    saveSepoliaDeployment(
      crosswordBoard.address,
      abiArtifacts.abi
    );
    console.log("✅ Contract address and ABI saved to frontend successfully!");
  } catch (saveError) {
    console.error("⚠️  Error saving to frontend:", saveError.message);
    console.log("Please run the save script manually after deployment:");
    console.log(`node scripts/save-sepolia-contracts.js ${crosswordBoard.address} [ABI_FILE_PATH]`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });