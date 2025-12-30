#!/bin/bash
# Script to update all deployment files with new contract addresses

echo "🔄 Updating all deployment files with new contract addresses..."

# Define new addresses
CROSSWORD_BOARD="0xdab0594b533628061ca532dfaa1ffdb7062e41b0"
CROSSWORD_CORE="0x3499b1ac9043ebea13eafa5957671813ed180a33"
CROSSWORD_PRIZES="0x38b2e899df5bd44d199b2fe7afdf519a3d9f32a9"
USER_PROFILES="0x7560878524944e2f94efeccfede4adf6dd2b4c9e"
CONFIG_MANAGER="0xd3f7051194e8fe162af915ac91d9b181d39ea571"
ADMIN_MANAGER="0xc5696d62bf84dd315c31035933ca3cf615989513"
PUBLIC_CROSSWORD_MANAGER="0xcf070b3f06b2ee1023df347e74835e3d8b0e294b"

# Update CrosswordBoard.json
echo "Updating CrosswordBoard.json..."
cd /Users/0x66/celo-crossword/apps/contracts/web/contracts
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('CrosswordBoard.json', 'utf8'));
data.address = '$CROSSWORD_BOARD';
fs.writeFileSync('CrosswordBoard.json', JSON.stringify(data, null, 2));
console.log('✅ CrosswordBoard.json updated');
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
console.log('✅ sepolia-deployment.json updated');
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
console.log('✅ modularized-sepolia-deployment.json updated');
"

echo "🎉 All deployment files updated successfully!"
echo "📋 New addresses:"
echo "CrosswordBoard: $CROSSWORD_BOARD"
echo ""
echo "💡 Remember to:"
echo "   1. Clear your browser cache/local storage"
echo "   2. Restart your frontend application"
echo "   3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)"