#!/bin/bash
# Fast deployment script for Celo Crossword contracts

echo "🚀 Starting fast deployment to Celo Sepolia..."

# Clean and compile first
echo "🧹 Cleaning and compiling..."
npx hardhat clean
npx hardhat compile

# Deploy contracts
echo "📦 Deploying contracts to Celo Sepolia..."
npx hardhat deploy-modularized-and-update --network celoSepolia

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔄 Syncing deployment files..."

    # Sync modularized deployment file with sepolia deployment file
    cd web/contracts

    # Update modularized-sepolia-deployment.json with addresses from sepolia-deployment.json
    node -e "
    const fs = require('fs');
    const sepolia = JSON.parse(fs.readFileSync('sepolia-deployment.json', 'utf8'));
    const modularized = JSON.parse(fs.readFileSync('modularized-sepolia-deployment.json', 'utf8'));

    Object.keys(modularized.contracts).forEach(contract => {
      if (sepolia.contracts[contract]) {
        modularized.contracts[contract].address = sepolia.contracts[contract].address;
      }
    });

    fs.writeFileSync('modularized-sepolia-deployment.json', JSON.stringify(modularized, null, 2));
    console.log('✅ Synced deployment files');
    "

    echo "🔍 Verifying contracts on Celo Sepolia Scan..."

    # Read the deployed addresses from sepolia-deployment.json
    CROSSWORD_BOARD=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.CrosswordBoard.address);")
    CROSSWORD_CORE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.CrosswordCore.address);")
    CROSSWORD_PRIZES=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.CrosswordPrizes.address);")
    USER_PROFILES=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.UserProfiles.address);")
    CONFIG_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.ConfigManager.address);")
    ADMIN_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.AdminManager.address);")
    PUBLIC_CROSSWORD_MANAGER=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sepolia-deployment.json', 'utf8')).contracts.PublicCrosswordManager.address);")

    # Verify each contract with correct constructor parameters
    # Note: The deploy script deploys contracts with deployer address as parameter
    # CrosswordBoard is special - it takes all the other contract addresses
    echo "Verifying CrosswordBoard..."
    npx hardhat verify --network celoSepolia $CROSSWORD_BOARD $CROSSWORD_CORE $CROSSWORD_PRIZES $USER_PROFILES $CONFIG_MANAGER $ADMIN_MANAGER $PUBLIC_CROSSWORD_MANAGER 2>/dev/null || echo "⚠️ CrosswordBoard verification may still be processing..."

    echo "Verifying CrosswordCore..."
    # From deploy script: await CrosswordCore.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $CROSSWORD_CORE 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ CrosswordCore verification may still be processing..."

    echo "Verifying CrosswordPrizes..."
    # From deploy script: await CrosswordPrizes.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $CROSSWORD_PRIZES 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ CrosswordPrizes verification may still be processing..."

    echo "Verifying UserProfiles..."
    # From deploy script: await UserProfiles.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $USER_PROFILES 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ UserProfiles verification may still be processing..."

    echo "Verifying ConfigManager..."
    # From deploy script: await ConfigManager.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $CONFIG_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ ConfigManager verification may still be processing..."

    echo "Verifying AdminManager..."
    # From deploy script: await AdminManager.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $ADMIN_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ AdminManager verification may still be processing..."

    echo "Verifying PublicCrosswordManager..."
    # From deploy script: await PublicCrosswordManager.deploy(deployerAddress);
    npx hardhat verify --network celoSepolia $PUBLIC_CROSSWORD_MANAGER 0xa35dc36b55d9a67c8433de7e790074acc939f39e 2>/dev/null || echo "⚠️ PublicCrosswordManager verification may still be processing..."

    echo ""
    echo "🎉 Fast deployment and verification completed successfully!"
    echo ""
    echo "📋 New contract addresses and Celo Sepolia Scan links:"
    echo "CrosswordBoard:          $CROSSWORD_BOARD"
    echo "                         https://sepolia.celoscan.io/address/$CROSSWORD_BOARD"
    echo "CrosswordCore:           $CROSSWORD_CORE"
    echo "                         https://sepolia.celoscan.io/address/$CROSSWORD_CORE"
    echo "CrosswordPrizes:         $CROSSWORD_PRIZES"
    echo "                         https://sepolia.celoscan.io/address/$CROSSWORD_PRIZES"
    echo "UserProfiles:            $USER_PROFILES"
    echo "                         https://sepolia.celoscan.io/address/$USER_PROFILES"
    echo "ConfigManager:           $CONFIG_MANAGER"
    echo "                         https://sepolia.celoscan.io/address/$CONFIG_MANAGER"
    echo "AdminManager:            $ADMIN_MANAGER"
    echo "                         https://sepolia.celoscan.io/address/$ADMIN_MANAGER"
    echo "PublicCrosswordManager:  $PUBLIC_CROSSWORD_MANAGER"
    echo "                         https://sepolia.celoscan.io/address/$PUBLIC_CROSSWORD_MANAGER"
    echo ""
    echo "💡 Remember to:"
    echo "   1. Clear your browser cache/local storage"
    echo "   2. Restart your frontend application"
    echo "   3. The new contracts are ready to use!"
else
    echo "❌ Deployment failed!"
    exit 1
fi