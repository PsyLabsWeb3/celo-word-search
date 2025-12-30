#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the artifacts directory
const artifactsDir = './artifacts/contracts';

function getContractSize(contractPath) {
  try {
    const artifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const bytecode = artifact.bytecode;
    // Remove the '0x' prefix and calculate the size
    const bytecodeWithoutPrefix = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
    const sizeInBytes = bytecodeWithoutPrefix.length / 2;
    return sizeInBytes;
  } catch (error) {
    console.error(`Error reading ${contractPath}:`, error.message);
    return null;
  }
}

function checkContractSizes() {
  console.log('Checking contract sizes...\n');
  
  const contracts = [
    'CrosswordCore.sol/CrosswordCore.json',
    'CrosswordPrizes.sol/CrosswordPrizes.json',
    'UserProfiles.sol/UserProfiles.json',
    'AdminManager.sol/AdminManager.json',
    'ConfigManager.sol/ConfigManager.json',
    'CrosswordBoard.sol/CrosswordBoard.json'
  ];
  
  let allUnderLimit = true;
  
  for (const contract of contracts) {
    const contractPath = path.join(artifactsDir, contract);
    if (fs.existsSync(contractPath)) {
      const sizeInBytes = getContractSize(contractPath);
      if (sizeInBytes !== null) {
        const sizeInKB = sizeInBytes / 1024;
        const underLimit = sizeInBytes <= 24576; // 24KB limit
        console.log(`${contract.replace('.json', '')}: ${sizeInBytes} bytes (${sizeInKB.toFixed(2)} KB) ${underLimit ? '✅' : '❌'}`);
        if (!underLimit) {
          allUnderLimit = false;
        }
      }
    } else {
      console.log(`${contract}: File not found`);
    }
  }
  
  console.log(`\nAll contracts under 24KB limit: ${allUnderLimit ? '✅ YES' : '❌ NO'}`);
  return allUnderLimit;
}

// Run the check
checkContractSizes();