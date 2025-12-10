#!/bin/bash

# Mainnet Contract Verification Script
# Run this script to verify the contract on CeloScan

CONTRACT_ADDRESS="0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648"
CONSTRUCTOR_ARG="0xA35Dc36B55D9A67c8433De7e790074ACC939f39e"

echo "========================================="
echo "Celo Mainnet Contract Verification"
echo "========================================="
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Constructor Arg: $CONSTRUCTOR_ARG"
echo ""
echo "Attempting verification..."
echo ""

npx hardhat verify --network celo $CONTRACT_ADDRESS "$CONSTRUCTOR_ARG"

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ Verification successful!"
    echo "View at: https://celoscan.io/address/$CONTRACT_ADDRESS#code"
else
    echo ""
    echo "❌ Verification failed with error code: $RESULT"
    echo ""
    echo "Common solutions:"
    echo "1. Wait 5-10 more minutes and try again (API indexing delay)"
    echo "2. Check CeloScan API status"
    echo "3. Verify the contract was deployed correctly"
    echo ""
    echo "To retry, run: bash verify-contract.sh"
fi
