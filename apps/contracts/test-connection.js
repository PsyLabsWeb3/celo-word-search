// Simple test to check network connection
async function testConnection() {
  const { ethers } = require("hardhat");
  
  try {
    console.log("Testing connection to Celo Sepolia...");
    
    // Get network info
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "chainId:", network.chainId);
    
    // Get signers
    const signers = await ethers.getSigners();
    console.log("Number of signers:", signers.length);
    if (signers.length > 0) {
      const address = await signers[0].getAddress();
      console.log("First signer address:", address);
      
      // Check balance
      const balance = await provider.getBalance(address);
      console.log("Balance:", ethers.formatEther(balance), "CELO");
    }
    
    console.log("Connection test completed successfully!");
  } catch (error) {
    console.error("Connection test failed:", error.message);
  }
}

testConnection();