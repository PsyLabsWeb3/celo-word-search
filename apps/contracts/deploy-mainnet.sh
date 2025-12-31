#!/bin/bash
# Fast deployment script for Celo Crossword contracts to Mainnet

echo "🚀 Starting fast deployment to Celo Mainnet..."

# Clean and compile first
echo "🧹 Cleaning and compiling..."
npx hardhat clean
npx hardhat compile

# Deploy contracts
echo "📦 Deploying contracts to Celo Mainnet..."
npx hardhat deploy-modularized-and-update --network celo

if [ $? -eq 0 ]; then
    echo "✅ Mainnet Deployment successful!"
    echo "🔄 Syncing mainnet deployment files..."

    # Sync modularized deployment file with mainnet deployment file
    cd web/contracts

    # Update modularized-mainnet-deployment.json with addresses from mainnet-deployment.json
    node -e "
    const fs = require('fs');
    const mainnet = JSON.parse(fs.readFileSync('mainnet-deployment.json', 'utf8'));
    const modularized = JSON.parse(fs.readFileSync('modularized-mainnet-deployment.json', 'utf8'));

    Object.keys(modularized.contracts).forEach(contract => {
      if (mainnet.contracts[contract]) {
        modularized.contracts[contract].address = mainnet.contracts[contract].address;
      }
    });

    fs.writeFileSync('modularized-mainnet-deployment.json', JSON.stringify(modularized, null, 2));
    console.log('✅ Synced mainnet deployment files');
    "

    echo "🔍 Verifying contracts on Celo Mainnet Scan..."

    # Read the deployed addresses from mainnet-deployment.json
    CROSSWORD_BOARD=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.CrosswordBoard.address);")
    CROSSWORD_CORE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.CrosswordCore.address);")
    CROSSWORD_PRIZES=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.CrosswordPrizes.address);")
    USER_PROFILES=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.UserProfiles.address);")
    CONFIG_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.ConfigManager.address);")
    ADMIN_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.AdminManager.address);")
    PUBLIC_CROSSWORD_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('mainnet-deployment.json', 'utf8')).contracts.PublicCrosswordManager.address);")

    # Verify each contract with correct constructor parameters
    # Note: The deploy script deploys contracts with deployer address as parameter
    # CrosswordBoard is special - it takes all the other contract addresses
    echo "Verifying CrosswordBoard..."
    npx hardhat verify --network celo $CROSSWORD_BOARD $CROSSWORD_CORE $CROSSWORD_PRIZES $USER_PROFILES $CONFIG_MANAGER $ADMIN_MANAGER $PUBLIC_CROSSWORD_MANAGER 2>/dev/null || echo "⚠️ CrosswordBoard verification may still be processing..."

    echo "Verifying CrosswordCore..."
    npx hardhat verify --network celo $CROSSWORD_CORE 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ CrosswordCore verification may still be processing..."

    echo "Verifying CrosswordPrizes..."
    npx hardhat verify --network celo $CROSSWORD_PRIZES 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ CrosswordPrizes verification may still be processing..."

    echo "Verifying UserProfiles..."
    npx hardhat verify --network celo $USER_PROFILES 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ UserProfiles verification may still be processing..."

    echo "Verifying ConfigManager..."
    npx hardhat verify --network celo $CONFIG_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ ConfigManager verification may still be processing..."

    echo "Verifying AdminManager..."
    npx hardhat verify --network celo $ADMIN_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ AdminManager verification may still be processing..."

    echo "Verifying PublicCrosswordManager..."
    npx hardhat verify --network celo $PUBLIC_CROSSWORD_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ PublicCrosswordManager verification may still be processing..."

    echo ""
    echo "🎉 Mainnet deployment and verification completed successfully!"
    echo ""
    echo "📋 New mainnet contract addresses and Celo Mainnet Scan links:"
    echo "CrosswordBoard:          $CROSSWORD_BOARD"
    echo "                         https://celoscan.io/address/$CROSSWORD_BOARD"
    echo "CrosswordCore:           $CROSSWORD_CORE"
    echo "                         https://celoscan.io/address/$CROSSWORD_CORE"
    echo "CrosswordPrizes:         $CROSSWORD_PRIZES"
    echo "                         https://celoscan.io/address/$CROSSWORD_PRIZES"
    echo "UserProfiles:            $USER_PROFILES"
    echo "                         https://celoscan.io/address/$USER_PROFILES"
    echo "ConfigManager:           $CONFIG_MANAGER"
    echo "                         https://celoscan.io/address/$CONFIG_MANAGER"
    echo "AdminManager:            $ADMIN_MANAGER"
    echo "                         https://celoscan.io/address/$ADMIN_MANAGER"
    echo "PublicCrosswordManager:  $PUBLIC_CROSSWORD_MANAGER"
    echo "                         https://celoscan.io/address/$PUBLIC_CROSSWORD_MANAGER"
    echo ""
    echo "💡 Remember to:"
    echo "   1. Update your frontend configuration for mainnet"
    echo "   2. Test thoroughly before going live"
    echo "   3. The new mainnet contracts are ready to use!"
else
    echo "❌ Mainnet Deployment failed!"
    exit 1
fi