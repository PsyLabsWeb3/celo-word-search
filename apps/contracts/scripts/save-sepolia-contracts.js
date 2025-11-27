// Script to save deployed contract addresses and ABIs to frontend - Unified Version
const fs = require("fs");
const path = require("path");

// Function to save contract information to frontend
function saveContractInfo(crosswordBoardAddress, crosswordBoardAbi) {
  // Create contracts directory if it doesn't exist
  const contractsDir = path.join(__dirname, "..", "web", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Create deployment info object
  const deploymentInfo = {
    network: "sepolia", // Could be "celoAlfajores" for testnet
    contracts: {
      CrosswordBoard: {
        address: crosswordBoardAddress,
        abi: crosswordBoardAbi,
      },
    },
    deployer: "DEPLOYER_WALLET_ADDRESS",
    timestamp: new Date().toISOString(),
  };

  // Save deployment info
  const deploymentInfoPath = path.join(contractsDir, "sepolia-deployment.json");
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentInfoPath}`);

  // Also save individual ABI for easier frontend use
  const crosswordBoardPath = path.join(contractsDir, "CrosswordBoard.json");

  fs.writeFileSync(crosswordBoardPath, JSON.stringify({
    address: crosswordBoardAddress,
    abi: crosswordBoardAbi
  }, null, 2));

  console.log("✅ Contract file updated with Sepolia address:");
  console.log(`- ${crosswordBoardPath}`);
  console.log(`- ${deploymentInfoPath}`);

  // Update the contracts.ts file to handle Sepolia addresses
  updateContractConfig(crosswordBoardAddress, crosswordBoardAbi);
}

// Function to update contracts.ts with Sepolia addresses
function updateContractConfig(crosswordBoardAddress, crosswordBoardAbi) {
  const contractsTsPath = path.join(__dirname, "..", "web", "src", "lib", "contracts.ts");

  // Read the current contracts.ts file
  let contractsContent = fs.readFileSync(contractsTsPath, 'utf8');

  // Check if Sepolia configuration already exists to avoid duplicates
  if (contractsContent.includes('// Sepolia network configuration')) {
    console.log("⚠️  Sepolia configuration already exists, skipping update to contracts.ts");
    return;
  }

  // Add Sepolia network configuration
  const sepoliaConfig = `\n// Sepolia network configuration
const SEPOLIA_CONTRACTS = {
  CrosswordBoard: {
    address: "${crosswordBoardAddress}",
    abi: ${JSON.stringify(crosswordBoardAbi, null, 2)},
  },
};`;

  // Append Sepolia configuration to the existing content
  const updatedContent = contractsContent + "\n" + sepoliaConfig;

  fs.writeFileSync(contractsTsPath, updatedContent);

  console.log("✅ Updated contracts.ts with Sepolia configuration");
}

// Example usage function (to be called after deployment)
function exampleUsage() {
  console.log("This script should be called after successful deployment with actual addresses and ABIs");

  // Example addresses (these would come from actual deployment)
  const exampleAddresses = {
    crosswordBoardAddress: "YOUR_UNIFIED_CROSSWORD_BOARD_ADDRESS_HERE"
  };

  // Example ABI (this would come from actual deployment)
  const exampleAbi = {
    crosswordBoardAbi: [ /* YOUR UNIFIED CROSSWORD BOARD ABI HERE */ ]
  };

  console.log("After deployment:");
  console.log("- Update the address and ABI in this script with actual values");
  console.log("- Then run this script to save them to the frontend");
}

// This function can be called with actual deployment results
function saveSepoliaDeployment(crosswordBoardAddress, crosswordBoardAbi) {
  if (!crosswordBoardAddress || !crosswordBoardAbi) {
    console.error("❌ Missing required deployment information");
    console.log("Please provide: crosswordBoardAddress, crosswordBoardAbi");
    return;
  }

  console.log("Saving unified Sepolia deployment information to frontend...");
  saveContractInfo(crosswordBoardAddress, crosswordBoardAbi);
  console.log("✅ Unified Sepolia deployment information saved successfully!");
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    exampleUsage();
  } else if (args.length === 2) {
    // Expected args: boardAddress boardAbiFile
    const [boardAddress, boardAbiFile] = args;

    // Read ABI file
    const boardAbi = JSON.parse(fs.readFileSync(boardAbiFile, 'utf8'));

    saveSepoliaDeployment(boardAddress, boardAbi);
  } else {
    console.log("Usage: node save-sepolia-contracts.js <board_address> <board_abi_file>");
    console.log("Example: node save-sepolia-contracts.js 0x123... ./board-abi.json");
  }
}

module.exports = {
  saveContractInfo,
  saveSepoliaDeployment
};