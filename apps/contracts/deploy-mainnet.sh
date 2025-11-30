#!/bin/bash

# Mainnet Deployment Script for CrosswordBoard
# This script deploys the CrosswordBoard contract to Celo Mainnet

set -e  # Exit on error

echo "🚀 CrosswordBoard Mainnet Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OWNER_ADDRESS="0x66299C18c60CE709777Ec79C73b131cE2634f58e"
NETWORK="celo"
CHAIN_ID="42220"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Network: Celo Mainnet"
echo "   Chain ID: $CHAIN_ID"
echo "   Owner Address: $OWNER_ADDRESS"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Load environment variables
source .env

# Verify required environment variables
echo -e "${BLUE}🔍 Verifying environment variables...${NC}"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PRIVATE_KEY found${NC}"

if [ -z "$CELOSCAN_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: CELOSCAN_API_KEY not set (verification will fail)${NC}"
else
    echo -e "${GREEN}✅ CELOSCAN_API_KEY found${NC}"
fi

if [ -z "$CELO_MAINNET_RPC" ]; then
    echo -e "${YELLOW}⚠️  Warning: CELO_MAINNET_RPC not set, using default${NC}"
else
    echo -e "${GREEN}✅ CELO_MAINNET_RPC found: $CELO_MAINNET_RPC${NC}"
fi

echo ""

# Check balance
echo -e "${BLUE}💰 Checking wallet balance...${NC}"
BALANCE=$(npx hardhat run check_balance.js --network $NETWORK 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "0")

if [ -z "$BALANCE" ] || [ "$BALANCE" == "0" ]; then
    echo -e "${RED}❌ Error: Insufficient balance or unable to check balance${NC}"
    echo "   Please ensure you have enough CELO for deployment"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Balance: $BALANCE CELO${NC}"
fi

echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  MAINNET DEPLOYMENT WARNING${NC}"
echo "   You are about to deploy to CELO MAINNET"
echo "   This will use REAL CELO for gas fees"
echo "   Owner will be: $OWNER_ADDRESS"
echo ""
read -p "Are you sure you want to continue? (yes/NO): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔨 Starting deployment...${NC}"
echo ""

# Deploy using Hardhat Ignition
echo -e "${BLUE}📦 Deploying contract with Hardhat Ignition...${NC}"

DEPLOY_OUTPUT=$(npx hardhat ignition deploy ignition/modules/CrosswordBoard.ts \
    --network $NETWORK \
    --parameters ignition/parameters.json 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE '0x[a-fA-F0-9]{40}' | tail -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Error: Could not extract contract address from deployment${NC}"
    echo "   Please check the deployment output above"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
echo -e "${GREEN}   Address: $CONTRACT_ADDRESS${NC}"
echo ""

# Save deployment info
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_FILE="mainnet_deployment_${TIMESTAMP}.json"

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "celo-mainnet",
  "chainId": $CHAIN_ID,
  "contractAddress": "$CONTRACT_ADDRESS",
  "ownerAddress": "$OWNER_ADDRESS",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "compiler": "0.8.28",
  "optimization": {
    "enabled": true,
    "runs": 1,
    "viaIR": true
  }
}
EOF

echo -e "${GREEN}✅ Deployment info saved to: $DEPLOYMENT_FILE${NC}"
echo ""

# Verify contract on CeloScan
echo -e "${BLUE}🔍 Verifying contract on CeloScan...${NC}"

if [ -z "$CELOSCAN_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Skipping verification (no API key)${NC}"
    echo "   You can verify manually later at:"
    echo "   https://celoscan.io/address/$CONTRACT_ADDRESS#code"
else
    sleep 5  # Wait for contract to be indexed
    
    VERIFY_OUTPUT=$(npx hardhat verify --network $NETWORK $CONTRACT_ADDRESS "$OWNER_ADDRESS" 2>&1 || true)
    
    if echo "$VERIFY_OUTPUT" | grep -q "Successfully verified" || echo "$VERIFY_OUTPUT" | grep -q "already been verified"; then
        echo -e "${GREEN}✅ Contract verified on CeloScan${NC}"
    else
        echo -e "${YELLOW}⚠️  Verification may have failed${NC}"
        echo "   You can verify manually later"
    fi
fi

echo ""

# Update frontend deployment file
echo -e "${BLUE}📝 Creating mainnet deployment file for frontend...${NC}"

FRONTEND_DEPLOYMENT_FILE="web/contracts/mainnet-deployment.json"

# Copy ABI from Sepolia deployment
if [ -f "web/contracts/sepolia-deployment.json" ]; then
    # Extract ABI from sepolia deployment and create mainnet deployment
    cat web/contracts/sepolia-deployment.json | \
        jq --arg addr "$CONTRACT_ADDRESS" '.network = "mainnet" | .contracts.CrosswordBoard.address = $addr' \
        > "$FRONTEND_DEPLOYMENT_FILE"
    
    echo -e "${GREEN}✅ Frontend deployment file created: $FRONTEND_DEPLOYMENT_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  Could not find sepolia-deployment.json to copy ABI${NC}"
    echo "   You'll need to update the frontend configuration manually"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "   Network: Celo Mainnet"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Owner: $OWNER_ADDRESS"
echo "   CeloScan: https://celoscan.io/address/$CONTRACT_ADDRESS"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. ✅ Contract deployed to mainnet"
echo "   2. ⏳ Update frontend configuration with mainnet address"
echo "   3. ⏳ Test basic functionality on mainnet"
echo "   4. ⏳ Monitor first transactions"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Verify the contract on CeloScan if not done automatically"
echo "   - Update your frontend to use: $CONTRACT_ADDRESS"
echo "   - Test admin functions before announcing to users"
echo "   - Monitor events and transactions closely"
echo ""
echo -e "${BLUE}📄 Files Created:${NC}"
echo "   - $DEPLOYMENT_FILE (deployment info)"
echo "   - $FRONTEND_DEPLOYMENT_FILE (frontend config)"
echo ""
echo -e "${GREEN}Deployment script completed successfully!${NC}"
