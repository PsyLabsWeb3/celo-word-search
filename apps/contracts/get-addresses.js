const hre = require("hardhat");

async function main() {
  const boardAddress = "0xf4db35d3beb4e1d0e4c50f46bb676064d4ce917c"; // Current address on Celo Sepolia
  
  // Use camelCase for public variable getters
  const abi = [
    {
      "name": "crosswordCore",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    },
    {
      "name": "crosswordPrizes",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    },
    {
      "name": "userProfiles",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    },
    {
      "name": "configManager",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    },
    {
      "name": "adminManager",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    },
    {
      "name": "publicCrosswordManager",
      "type": "function",
      "stateMutability": "view",
      "inputs": [],
      "outputs": [{ "type": "address" }]
    }
  ];

  const publicClient = await hre.viem.getPublicClient();

  try {
    const core = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'crosswordCore'
    });
    const prizes = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'crosswordPrizes'
    });
    const profiles = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'userProfiles'
    });
    const config = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'configManager'
    });
    const admin = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'adminManager'
    });
    const publicMgr = await publicClient.readContract({
      address: boardAddress,
      abi,
      functionName: 'publicCrosswordManager'
    });

    console.log("\n📋 Current Deployed Addresses (Celo Sepolia):");
    console.log("------------------------------------------");
    console.log(`CrosswordBoard:          ${boardAddress}`);
    console.log(`CrosswordCore:           ${core}`);
    console.log(`CrosswordPrizes:         ${prizes}`);
    console.log(`UserProfiles:            ${profiles}`);
    console.log(`ConfigManager:           ${config}`);
    console.log(`AdminManager:            ${admin}`);
    console.log(`PublicCrosswordManager:  ${publicMgr}`);
    console.log("------------------------------------------\n");
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
