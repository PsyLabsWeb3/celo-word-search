// Test script to check if the private key and RPC are working
const { ethers } = require("ethers");

async function testConnection() {
  console.log("Testing connection with raw ethers.js...");
  
  // Use the private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.CELO_SEPOLIA_RPC || "https://rpc.ankr.com/celo_sepolia";
  
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in environment");
    return;
  }
  
  console.log("RPC URL:", rpcUrl);
  console.log("Private key length:", privateKey.length);
  
  try {
    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test connection
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "chainId:", network.chainId);
    
    // Create wallet with private key
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Wallet address:", wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "CELO");
    
    console.log("Connection test successful!");
  } catch (error) {
    console.error("Connection test failed:", error.message);
  }
}

testConnection();