// SPDX-License-Identifier: MIT
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Configuring crossword prizes contract for custom number of winners");

  // You'll need to deploy the contracts first and get their addresses
  // Replace these with the actual deployed addresses on Sepolia
  const crosswordPrizesAddress = process.env.CROSSWORD_PRIZES_ADDRESS || "YOUR_CROSSWORD_PRIZES_CONTRACT_ADDRESS";
  
  if (!crosswordPrizesAddress || crosswordPrizesAddress.includes("YOUR_")) {
    console.log("❌ Please set CROSSWORD_PRIZES_ADDRESS in your .env file with the actual deployed address");
    console.log("💡 First deploy contracts using: npx hardhat run deploy-sepolia.js --network sepolia");
    return;
  }

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`\nUsing account: ${await deployer.getAddress()}`);

  // Connect to deployed contract
  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.attach(crosswordPrizesAddress);

  // Get current max winners
  const currentMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log(`📊 Current max winners: ${currentMaxWinners}`);

  // Get desired number of winners from environment or prompt
  const desiredWinners = parseInt(process.env.NUMBER_OF_WINNERS) || 5;
  console.log(`🎯 Desired max winners: ${desiredWinners}`);

  if (desiredWinners <= 0) {
    console.log("❌ Number of winners must be greater than 0");
    return;
  }

  if (desiredWinners > 1000) {
    console.log("❌ Max configurable winners is 1000, please use a value between 1 and 1000");
    return;
  }

  if (desiredWinners <= currentMaxWinners) {
    console.log(`⚠️  Current max winners (${currentMaxWinners}) is already >= desired (${desiredWinners})`);
    console.log("✅ No configuration change needed");
    return;
  }

  // Update max winners
  console.log(`\n🔄 Updating max winners from ${currentMaxWinners} to ${desiredWinners}...`);
  
  const tx = await crosswordPrizes.setMaxWinners(desiredWinners);
  await tx.wait();
  
  const newMaxWinners = await crosswordPrizes.getMaxWinners();
  console.log(`✅ Max winners successfully updated to: ${newMaxWinners}`);

  // Example configuration for a crossword with desired number of winners
  console.log("\n📋 Example prize distribution for", desiredWinners, "winners:");
  const totalPercentage = 10000; // 100% in basis points
  const equalPercentage = Math.floor(totalPercentage / desiredWinners);
  const remainder = totalPercentage % desiredWinners;
  
  const percentages = [];
  for (let i = 0; i < desiredWinners; i++) {
    if (i === 0) {
      // First place gets the remainder if not evenly divisible
      percentages.push(equalPercentage + remainder);
    } else {
      percentages.push(equalPercentage);
    }
  }

  console.log(`🏆 Winner percentages: [${percentages.join(', ')}]`);
  console.log(`💡 Total: ${percentages.reduce((a, b) => a + b, 0)} basis points (100%)`);

  console.log("\n✨ Configuration completed successfully!");
  console.log("📝 You can now create crosswords with up to", desiredWinners, "winners");
  console.log("💡 When creating a crossword, specify", desiredWinners, "percentage values for the prize distribution");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Configuration failed:", error);
    process.exit(1);
  });