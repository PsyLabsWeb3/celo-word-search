const hre = require("hardhat");

async function main() {
  console.log("HRE:", hre);
  const { ethers } = hre;
  console.log("Ethers:", ethers);
  const { CONTRACTS } = require("../web/src/lib/contracts");
  const chainId = 11142220; // Celo Sepolia

  const crosswordBoardAddress = CONTRACTS[chainId].CrosswordBoard.address;
  const crosswordPrizesAddress = CONTRACTS[chainId].CrosswordPrizes.address;

  const crosswordPrizes = await ethers.getContractAt("CrosswordPrizes", crosswordPrizesAddress);

  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

  const hasRole = await crosswordPrizes.hasRole(OPERATOR_ROLE, crosswordBoardAddress);

  console.log(`CrosswordBoard address: ${crosswordBoardAddress}`);
  console.log(`CrosswordPrizes address: ${crosswordPrizesAddress}`);
  console.log(`OPERATOR_ROLE: ${OPERATOR_ROLE}`);
  console.log(`Does CrosswordBoard have OPERATOR_ROLE on CrosswordPrizes? ${hasRole}`);

  if (!hasRole) {
    console.log("\nGranting OPERATOR_ROLE to CrosswordBoard...");
    const [deployer] = await ethers.getSigners();
    const tx = await crosswordPrizes.connect(deployer).grantRole(OPERATOR_ROLE, crosswordBoardAddress);
    await tx.wait();
    console.log("Role granted.");
    const hasRoleAfter = await crosswordPrizes.hasRole(OPERATOR_ROLE, crosswordBoardAddress);
    console.log(`Does CrosswordBoard have OPERATOR_ROLE on CrosswordPrizes now? ${hasRoleAfter}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
