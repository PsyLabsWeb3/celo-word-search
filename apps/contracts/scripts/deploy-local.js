const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the viem public client and wallet client
  const publicClient = await hre.viem.getPublicClient();
  const [deployerWalletClient] = await hre.viem.getWalletClients();

  console.log("Deploying contracts with the account:", deployerWalletClient.account.address);

  // Deploy CrosswordPrizes first (needed for CrosswordBoard constructor)
  console.log("\nDeploying CrosswordPrizes...");
  const crosswordPrizes = await hre.viem.deployContract("CrosswordPrizes", [deployerWalletClient.account.address]);
  console.log("CrosswordPrizes deployed to:", crosswordPrizes.address);

  // Deploy Config contract
  console.log("\nDeploying Config...");
  const configContract = await hre.viem.deployContract("Config", [deployerWalletClient.account.address]);
  console.log("Config deployed to:", configContract.address);

  // Deploy CrosswordBoard (passing the addresses of the other contracts)
  console.log("\nDeploying CrosswordBoard...");
  const crosswordBoard = await hre.viem.deployContract("CrosswordBoard", [
    deployerWalletClient.account.address,
    crosswordPrizes.address,
    configContract.address
  ]);
  console.log("CrosswordBoard deployed to:", crosswordBoard.address);

  // Add additional admin address
  const additionalAdmin = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

  // Add admin to CrosswordBoard using viem contract
  console.log("\nAdding admin to CrosswordBoard:", additionalAdmin);
  const crosswordBoardContract = await hre.viem.getContractAt("CrosswordBoard", crosswordBoard.address);
  const addAdminTx = await crosswordBoardContract.write.addAdmin([additionalAdmin], { account: deployerWalletClient.account });
  console.log("✅ Additional admin added to CrosswordBoard");

  // Grant admin role on CrosswordPrizes
  console.log("Granting admin role on CrosswordPrizes:", additionalAdmin);
  const crosswordPrizesContract = await hre.viem.getContractAt("CrosswordPrizes", crosswordPrizes.address);
  const { keccak256, toBytes } = require("viem");
  const adminRole = keccak256(toBytes("ADMIN_ROLE"));
  const grantRoleTx = await crosswordPrizesContract.write.grantRole([adminRole, additionalAdmin], { account: deployerWalletClient.account });
  console.log("✅ Admin role granted on CrosswordPrizes");

  console.log("✅ Additional admin (0x66299C18c60CE709777Ec79C73b131cE2634f58e) added to both contracts");

  // Get contract ABIs from artifacts
  const crosswordBoardArtifact = await hre.artifacts.readArtifact("CrosswordBoard");
  const crosswordPrizesArtifact = await hre.artifacts.readArtifact("CrosswordPrizes");

  // Create deployment info object
  const deploymentInfo = {
    network: "localhost",
    contracts: {
      CrosswordBoard: {
        address: crosswordBoard.address,
        abi: crosswordBoardArtifact.abi,
      },
      CrosswordPrizes: {
        address: crosswordPrizes.address,
        abi: crosswordPrizesArtifact.abi,
      },
    },
    deployer: deployerWalletClient.account.address,
    timestamp: new Date().toISOString(),
  };

  // Create contracts directory if it doesn't exist
  const contractsDir = path.join(__dirname, "..", "web", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentInfoPath = path.join(contractsDir, "local-deployment.json");
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentInfoPath}`);

  // Also save individual ABIs for easier frontend use
  const crosswordBoardAbiPath = path.join(contractsDir, "CrosswordBoard.json");
  const crosswordPrizesAbiPath = path.join(contractsDir, "CrosswordPrizes.json");

  fs.writeFileSync(crosswordBoardAbiPath, JSON.stringify({
    address: crosswordBoard.address,
    abi: crosswordBoardArtifact.abi
  }, null, 2));

  fs.writeFileSync(crosswordPrizesAbiPath, JSON.stringify({
    address: crosswordPrizes.address,
    abi: crosswordPrizesArtifact.abi
  }, null, 2));

  console.log("Individual contract ABIs saved to:");
  console.log(`- ${crosswordBoardAbiPath}`);
  console.log(`- ${crosswordPrizesAbiPath}`);

  console.log("\nDeployment completed successfully!");
  console.log("\nContract addresses:");
  console.log(`CrosswordBoard: ${crosswordBoard.address}`);
  console.log(`CrosswordPrizes: ${crosswordPrizes.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });