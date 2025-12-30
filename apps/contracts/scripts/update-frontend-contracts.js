// Script to update frontend contracts.ts with modularized deployment
const fs = require('fs');
const path = require('path');

// Function to update contracts.ts with modularized deployment
function updateFrontendContracts(deploymentInfo) {
  console.log('Updating frontend contracts.ts with modularized deployment...');

  // Read the current contracts.ts file
  const contractsTsPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'contracts.ts');

  try {
    let contractsContent = fs.readFileSync(contractsTsPath, 'utf8');

    // Create new configuration for modularized contracts
    const newSepoliaConfig = `
// Sepolia network configuration (MODULARIZED)
const SEPOLIA_CONTRACTS = {
  CrosswordBoard: {
    address: "${deploymentInfo.contracts.CrosswordBoard.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.CrosswordBoard.abi, null, 2)},
  },
  CrosswordCore: {
    address: "${deploymentInfo.contracts.CrosswordCore.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.CrosswordCore.abi, null, 2)},
  },
  CrosswordPrizes: {
    address: "${deploymentInfo.contracts.CrosswordPrizes.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.CrosswordPrizes.abi, null, 2)},
  },
  UserProfiles: {
    address: "${deploymentInfo.contracts.UserProfiles.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.UserProfiles.abi, null, 2)},
  },
  ConfigManager: {
    address: "${deploymentInfo.contracts.ConfigManager.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.ConfigManager.abi, null, 2)},
  },
  AdminManager: {
    address: "${deploymentInfo.contracts.AdminManager.address}",
    abi: ${JSON.stringify(deploymentInfo.contracts.AdminManager.abi, null, 2)},
  },
};`;

    // Update the content by replacing the old SEPOLIA_CONTRACTS with the new one
    // Look for the section that starts with "// Sepolia network configuration" and replace it
    const updatedContent = contractsContent.replace(
      /\/\/ Sepolia network configuration[\s\S]*?(?=\/\/ (Mainnet|Alfajores)|$)/,
      newSepoliaConfig + '\n\n'
    );

    // Write the updated content back to the file
    fs.writeFileSync(contractsTsPath, updatedContent);
    console.log('✅ Updated contracts.ts with modularized Sepolia configuration');
  } catch (error) {
    console.error('⚠️ Error updating contracts.ts:', error.message);
    console.log('Will continue with deployment, contract addresses saved to JSON files.');
  }

  // Also update the individual ABI files
  const contractsDir = path.join(__dirname, '..', 'web', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save individual contract files
  for (const [contractName, contractInfo] of Object.entries(deploymentInfo.contracts)) {
    const contractFilePath = path.join(contractsDir, `${contractName}.json`);
    fs.writeFileSync(contractFilePath, JSON.stringify(contractInfo, null, 2));
    console.log(`✅ Updated ${contractName}.json`);
  }
}

// If called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const deploymentInfoPath = args[0];
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    updateFrontendContracts(deploymentInfo);
  } else {
    console.log('Usage: node update-frontend-contracts.js <deployment-info-file.json>');
  }
}

module.exports = {
  updateFrontendContracts
};