#!/bin/bash
# Complete update script for all deployment files

echo "🔄 Updating ALL deployment files with NEWEST contract addresses..."

# Define newest addresses from the latest deployment
CROSSWORD_BOARD="0x896d691883806f0e108e3a8312283a5c3fbca929"
CROSSWORD_CORE="0x876f5386693317028995cb17b924e9e1c5446bb4"
CROSSWORD_PRIZES="0x756ef2ba055b0d76814178025113728165e46528"
USER_PROFILES="0x4b7d7a5ca717fee7d98eb73432abadd7a875c2fd"
CONFIG_MANAGER="0x0aa8c7f3428f62bb5c5eac46647242b0db00ce72"
ADMIN_MANAGER="0x4da124164cca0d54765b0c5e875dbe594ee837de"
PUBLIC_CROSSWORD_MANAGER="0x85e90f0b4fd397453b4276b70b52be99fe411746"

cd /Users/0x66/celo-crossword/apps/contracts

echo "Updating sepolia-deployment.json..."
node -e "
const fs = require('fs');
const sepoliaData = JSON.parse(fs.readFileSync('web/contracts/sepolia-deployment.json', 'utf8'));
sepoliaData.contracts.CrosswordBoard.address = '$CROSSWORD_BOARD';
sepoliaData.contracts.CrosswordCore.address = '$CROSSWORD_CORE';
sepoliaData.contracts.CrosswordPrizes.address = '$CROSSWORD_PRIZES';
sepoliaData.contracts.UserProfiles.address = '$USER_PROFILES';
sepoliaData.contracts.ConfigManager.address = '$CONFIG_MANAGER';
sepoliaData.contracts.AdminManager.address = '$ADMIN_MANAGER';
sepoliaData.contracts.PublicCrosswordManager.address = '$PUBLIC_CROSSWORD_MANAGER';
fs.writeFileSync('web/contracts/sepolia-deployment.json', JSON.stringify(sepoliaData, null, 2));
console.log('✅ sepolia-deployment.json updated');
"

echo "Updating modularized-sepolia-deployment.json..."
node -e "
const fs = require('fs');
const modularizedData = JSON.parse(fs.readFileSync('web/contracts/modularized-sepolia-deployment.json', 'utf8'));
modularizedData.contracts.CrosswordBoard.address = '$CROSSWORD_BOARD';
modularizedData.contracts.CrosswordCore.address = '$CROSSWORD_CORE';
modularizedData.contracts.CrosswordPrizes.address = '$CROSSWORD_PRIZES';
modularizedData.contracts.UserProfiles.address = '$USER_PROFILES';
modularizedData.contracts.ConfigManager.address = '$CONFIG_MANAGER';
modularizedData.contracts.AdminManager.address = '$ADMIN_MANAGER';
modularizedData.contracts.PublicCrosswordManager.address = '$PUBLIC_CROSSWORD_MANAGER';
fs.writeFileSync('web/contracts/modularized-sepolia-deployment.json', JSON.stringify(modularizedData, null, 2));
console.log('✅ modularized-sepolia-deployment.json updated');
"

echo "Updating CrosswordBoard.json..."
node -e "
const fs = require('fs');
const crosswordBoardData = JSON.parse(fs.readFileSync('web/contracts/CrosswordBoard.json', 'utf8'));
crosswordBoardData.address = '$CROSSWORD_BOARD';
fs.writeFileSync('web/contracts/CrosswordBoard.json', JSON.stringify(crosswordBoardData, null, 2));
console.log('✅ CrosswordBoard.json updated');
"

echo "Updating contracts.ts..."
node -e "
const fs = require('fs');
let contractsContent = fs.readFileSync('web/src/lib/contracts.ts', 'utf8');

// Update all addresses
contractsContent = contractsContent.replace(
  /CrosswordBoard: \\{[\\s\\S]*?address: [\"']0x[a-fA-F0-9]+[\"']/,
  \`CrosswordBoard: {
      address: \\\"\${'$CROSSWORD_BOARD'}\\\`
);

contractsContent = contractsContent.replace(
  /CrosswordCore: \\{[\\s\\S]*?address: [\"']0x[a-fA-F0-9]+[\"']/,
  \`CrosswordCore: {
      address: \\\"\${'$CROSSWORD_CORE'}\\\`
);

contractsContent = contractsContent.replace(
  /CrosswordPrizes: \\{[\\s\\S]*?address: [\"']0x[a-fA-F0-9]+[\"']/,
  \`CrosswordPrizes: {
      address: \\\"\${'$CROSSWORD_PRIZES'}\\\`
);

fs.writeFileSync('web/src/lib/contracts.ts', contractsContent);
console.log('✅ contracts.ts updated');
"

echo "🎉 ALL configuration files updated with NEWEST addresses!"
echo "📋 New addresses:"
echo "CrosswordBoard: $CROSSWORD_BOARD"
echo "PublicCrosswordManager: $PUBLIC_CROSSWORD_MANAGER"
echo ""
echo "💡 Remember to:"
echo "   1. Clear your browser cache/local storage COMPLETELY"
echo "   2. Close ALL browser windows/tabs"
echo "   3. Restart your frontend application"
echo "   4. The contracts with your changes are now live!"