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
    
    echo "🎉 Fast deployment completed successfully!"
    echo "📋 New contract addresses:"
    grep -A 1 "CrosswordBoard" sepolia-deployment.json | grep "address"
    echo ""
    echo "💡 Remember to:"
    echo "   1. Clear your browser cache/local storage"
    echo "   2. Restart your frontend application"
    echo "   3. The new contracts are ready to use!"
else
    echo "❌ Deployment failed!"
    exit 1
fi