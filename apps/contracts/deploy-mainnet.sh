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

    echo "🎉 Mainnet deployment completed successfully!"
    echo "📋 New mainnet contract addresses:"
    grep -A 1 "CrosswordBoard" mainnet-deployment.json | grep "address"
    echo ""
    echo "💡 Remember to:"
    echo "   1. Update your frontend configuration for mainnet"
    echo "   2. Test thoroughly before going live"
    echo "   3. The new mainnet contracts are ready to use!"
else
    echo "❌ Mainnet Deployment failed!"
    exit 1
fi