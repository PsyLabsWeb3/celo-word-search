const fs = require('fs');
const path = require('path');

const contractsDir = '/Users/0x66/celo-crossword/apps/contracts/artifacts/contracts';
const webAbisDir = '/Users/0x66/celo-crossword/apps/web/src/lib/abis';

const contractsToExport = [
  'CrosswordBoard',
  'CrosswordCore',
  'CrosswordPrizes',
  'PublicCrosswordManager',
  'AdminManager',
  'ConfigManager'
];

contractsToExport.forEach(contractName => {
  const artifactPath = path.join(contractsDir, `${contractName}.sol`, `${contractName}.json`);
  const destPath = path.join(webAbisDir, `${contractName}.json`);
  
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    // We only need the abi for the frontend to save space, but the current project 
    // seems to use the full artifact format in some places. 
    // To be safe, we'll keep the full format but we MUST update it.
    fs.writeFileSync(destPath, JSON.stringify(artifact, null, 2));
    console.log(`✅ Exported ${contractName} ABI to frontend`);
  } else {
    console.warn(`⚠️ Artifact not found for ${contractName} at ${artifactPath}`);
  }
});
