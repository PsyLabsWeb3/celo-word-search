const hre = require("hardhat");
const { keccak256, toHex } = require("viem");

async function main() {
  const crosswordPrizesAddress = "0x817a51755be9b6b0dc408bde7edf796706ceb4cb"; // Latest CrosswordPrizes address
  const crosswordBoardAddress = "0xe83fbe75d46ad64f045b996de0365b47b6f634af"; // Latest CrosswordBoard address
  const deployerAddress = "0xa35dc36b55d9a67c8433de7e790074acc939f39e"; // Deployer's address

  console.log("Querying roles and status on CrosswordPrizes contract...");
  console.log(`CrosswordPrizes Address: ${crosswordPrizesAddress}`);
  console.log(`CrosswordBoard Address: ${crosswordBoardAddress}`);
  console.log(`Deployer Address: ${deployerAddress}`);

  const prizesContract = await hre.viem.getContractAt(
    "CrosswordPrizes", // Assuming CrosswordPrizes.sol is compiled
    crosswordPrizesAddress
  );

  const ADMIN_ROLE = keccak256(toHex("ADMIN_ROLE"));
  console.log(`ADMIN_ROLE hash: ${ADMIN_ROLE}`);

  // Check if CrosswordBoard has ADMIN_ROLE on CrosswordPrizes
  const hasBoardAdminRole = await prizesContract.read.hasRole([ADMIN_ROLE, crosswordBoardAddress]);
  console.log(`Does CrosswordBoard (${crosswordBoardAddress}) have ADMIN_ROLE on CrosswordPrizes? ${hasBoardAdminRole}`);

  // Check if deployer has ADMIN_ROLE on CrosswordPrizes
  const hasDeployerAdminRole = await prizesContract.read.hasRole([ADMIN_ROLE, deployerAddress]);
  console.log(`Does Deployer (${deployerAddress}) have ADMIN_ROLE on CrosswordPrizes? ${hasDeployerAdminRole}`);
  
  // Check paused status
  const isPaused = await prizesContract.read.paused();
  console.log(`Is CrosswordPrizes paused? ${isPaused}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });