#!/bin/bash
# Final script to update all deployment files with the latest contract addresses

echo "🔄 Updating all deployment files with LATEST contract addresses..."

# Define latest addresses from the most recent deployment
CROSSWORD_BOARD="0x2d5e026fbac74f288e8c85aa4895569e30af46d9"
CROSSWORD_CORE="0x7210cff9d2ba716ed7ffd10df570a72842b6d336"
CROSSWORD_PRIZES="0xcbf64b1fa207a558b09e39d01707a5d337a77fad"
USER_PROFILES="0x70283ae7c192801e0d1559cc8175f8ec07d031f6"
CONFIG_MANAGER="0x4a572f89642df70d454e0e65d50839a2b1bfb357"
ADMIN_MANAGER="0x19f8fc2c12d003f2e1fef7ec3cc52ca42b5bdc5f"
PUBLIC_CROSSWORD_MANAGER="0x635d2aaff690d3675d8e519462a9f94cd272740a"

cd /Users/0x66/celo-crossword/apps/contracts/web/contracts

# Update CrosswordBoard.json
echo "Updating CrosswordBoard.json..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('CrosswordBoard.json', 'utf8'));
data.address = '$CROSSWORD_BOARD';
fs.writeFileSync('CrosswordBoard.json', JSON.stringify(data, null, 2));
console.log('✅ CrosswordBoard.json updated with LATEST address');
"

# Update sepolia-deployment.json
echo "Updating sepolia-deployment.json..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('sepolia-deployment.json', 'utf8'));
data.contracts.CrosswordBoard.address = '$CROSSWORD_BOARD';
data.contracts.CrosswordCore.address = '$CROSSWORD_CORE';
data.contracts.CrosswordPrizes.address = '$CROSSWORD_PRIZES';
data.contracts.UserProfiles.address = '$USER_PROFILES';
data.contracts.ConfigManager.address = '$CONFIG_MANAGER';
data.contracts.AdminManager.address = '$ADMIN_MANAGER';
data.contracts.PublicCrosswordManager.address = '$PUBLIC_CROSSWORD_MANAGER';
fs.writeFileSync('sepolia-deployment.json', JSON.stringify(data, null, 2));
console.log('✅ sepolia-deployment.json updated with LATEST addresses');
"

# Update modularized-sepolia-deployment.json
echo "Updating modularized-sepolia-deployment.json..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('modularized-sepolia-deployment.json', 'utf8'));
data.contracts.CrosswordBoard.address = '$CROSSWORD_BOARD';
data.contracts.CrosswordCore.address = '$CROSSWORD_CORE';
data.contracts.CrosswordPrizes.address = '$CROSSWORD_PRIZES';
data.contracts.UserProfiles.address = '$USER_PROFILES';
data.contracts.ConfigManager.address = '$CONFIG_MANAGER';
data.contracts.AdminManager.address = '$ADMIN_MANAGER';
data.contracts.PublicCrosswordManager.address = '$PUBLIC_CROSSWORD_MANAGER';
fs.writeFileSync('modularized-sepolia-deployment.json', JSON.stringify(data, null, 2));
console.log('✅ modularized-sepolia-deployment.json updated with LATEST addresses');
"

echo "🎉 All deployment files updated with LATEST addresses!"
echo "📋 New addresses:"
echo "CrosswordBoard: $CROSSWORD_BOARD"
echo "CrosswordCore: $CROSSWORD_CORE"
echo "CrosswordPrizes: $CROSSWORD_PRIZES"
echo ""
echo "💡 Remember to:"
echo "   1. Clear your browser cache/local storage COMPLETELY"
echo "   2. Close ALL browser windows/tabs"
echo "   3. Restart your frontend application"
echo "   4. Open a new browser window to test"
echo "   5. With fresh contracts, you should see NO active crosswords"