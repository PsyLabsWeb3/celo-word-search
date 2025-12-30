const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const { CONTRACTS } = require("../web/src/lib/contracts");
  const chainId = 11142220; // Celo Sepolia

  const crosswordId = process.env.CROSSWORD_ID;
  if (!crosswordId) {
    console.error("Please provide a CROSSWORD_ID environment variable.");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const crosswordPrizesAddress = CONTRACTS[chainId].CrosswordPrizes.address;
  const crosswordPrizes = await ethers.getContractAt("contracts/CrosswordPrizes.sol:CrosswordPrizes", crosswordPrizesAddress);

  console.log("Attempting to claim prize directly on CrosswordPrizes...");
  const tx = await crosswordPrizes.connect(deployer).claimPrize(crosswordId);
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("Transaction confirmed.");
  console.log("Prize claimed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
