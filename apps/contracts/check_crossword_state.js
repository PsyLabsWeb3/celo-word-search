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

  const userAddress = process.env.USER_ADDRESS;
  if (!userAddress) {
    console.error("Please provide a USER_ADDRESS environment variable.");
    process.exit(1);
  }

  const crosswordPrizesAddress = CONTRACTS[chainId].CrosswordPrizes.address;
  const crosswordPrizes = await ethers.getContractAt("contracts/CrosswordPrizes.sol:CrosswordPrizes", crosswordPrizesAddress);

  const crosswordDetails = await crosswordPrizes.getCrosswordDetails(crosswordId);

  console.log("Crossword State from CrosswordPrizes:");
  console.log("  - token:", crosswordDetails[0]);
  console.log("  - totalPrizePool:", ethers.formatEther(crosswordDetails[1]), "CELO");
  console.log("  - winnerPercentages:", crosswordDetails[2].map(p => Number(p) / 100).join('%, ') + '%');
  console.log("  - winners:", crosswordDetails[3]);
  console.log("  - activationTime:", new Date(Number(crosswordDetails[4]) * 1000).toLocaleString());
  console.log("  - endTime:", Number(crosswordDetails[5]) > 0 ? new Date(Number(crosswordDetails[5]) * 1000).toLocaleString() : "Not set");
  console.log("  - state:", ["Inactive", "Active", "Complete"][crosswordDetails[6]]);
  console.log("  - isFinalized:", crosswordDetails[7]);

  const isWinner = await crosswordPrizes.isWinner(crosswordId, userAddress);
  console.log(`\nIs ${userAddress} a winner? ${isWinner}`);

  const rank = await crosswordPrizes.getUserRank(crosswordId, userAddress);
  console.log(`Rank of ${userAddress}: ${rank}`);


  const crosswordCoreAddress = CONTRACTS[chainId].CrosswordCore.address;
  const crosswordCore = await ethers.getContractAt("CrosswordCore", crosswordCoreAddress);
  const completions = await crosswordCore.getCrosswordCompletions(crosswordId);
  console.log("\nCompletions from CrosswordCore:", completions.length);
  completions.forEach((c, i) => {
    console.log(`  - Completion #${i + 1}:
`);
    console.log(`    - user: ${c.user}
`);
    console.log(`    - timestamp: ${new Date(Number(c.completionTimestamp) * 1000).toLocaleString()}
`);
    console.log(`    - durationMs: ${c.durationMs}
`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});