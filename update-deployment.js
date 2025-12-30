const fs = require('fs');
const path = require('path');

// Define the new addresses
const newAddresses = {
  "CrosswordBoard": "0x560e42112b88b8daa91f7310e7e7ae903572733c",
  "CrosswordCore": "0x80a70f71d8edbb0ecb951e4a78282a15ae2f1bc3",
  "CrosswordPrizes": "0xeb0962a528b2a9618d983278a05201cfb7358304",
  "UserProfiles": "0x98cd71af89cb8e1c7e1c58e4043a9f83555a886f",
  "ConfigManager": "0xf7d10ba3b9faffd288b53ac3028796e7038bfdca",
  "AdminManager": "0x17b4b334e7795cdb38a41986758a9a748483f925",
  "PublicCrosswordManager": "0x7fe1312983248c186c3a9eb4ad71d013521490e9"
};

// Read the deployment file
const deploymentPath = path.join(__dirname, 'apps', 'contracts', 'web', 'contracts', 'sepolia-deployment.json');
const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

// Update the addresses
for (const [contractName, newAddress] of Object.entries(newAddresses)) {
  if (deploymentData.contracts[contractName]) {
    console.log(`Updating ${contractName}: ${deploymentData.contracts[contractName].address} -> ${newAddress}`);
    deploymentData.contracts[contractName].address = newAddress;
  } else {
    console.log(`Contract ${contractName} not found in deployment file`);
  }
}

// Write the updated file
fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
console.log('✅ Deployment file updated successfully!');