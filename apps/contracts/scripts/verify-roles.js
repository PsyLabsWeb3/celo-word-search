const hre = require("hardhat");

async function main() {
  const crosswordBoardAddress = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const expectedPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";

  console.log("Verifying contract roles and addresses...");
  console.log(`CrosswordBoard Address: ${crosswordBoardAddress}`);
  console.log(`Expected CrosswordPrizes Address: ${expectedPrizesAddress}`);

  // Get CrosswordBoard contract instance
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // 1. Read the prizesContract address from CrosswordBoard
  const actualPrizesAddress = await crosswordBoard.read.prizesContract();
  console.log(`Address of prizesContract stored in CrosswordBoard: ${actualPrizesAddress}`);

  if (actualPrizesAddress.toLowerCase() !== expectedPrizesAddress.toLowerCase()) {
    console.error("❌ ERROR: CrosswordBoard is linked to the wrong CrosswordPrizes contract!");
    console.error(` -> Expected: ${expectedPrizesAddress}`);
    console.error(` -> Stored in contract: ${actualPrizesAddress}`);
    return;
  }
  console.log("✅ CrosswordBoard is linked to the correct CrosswordPrizes contract.");

  // 2. Check if CrosswordBoard has ADMIN_ROLE on CrosswordPrizes
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", actualPrizesAddress);
  const ADMIN_ROLE = await crosswordPrizes.read.ADMIN_ROLE();
  console.log(`ADMIN_ROLE hash: ${ADMIN_ROLE}`);

  const hasAdminRole = await crosswordPrizes.read.hasRole([ADMIN_ROLE, crosswordBoardAddress]);

  if (hasAdminRole) {
    console.log("✅ VERIFIED: CrosswordBoard has ADMIN_ROLE on CrosswordPrizes.");
  } else {
    console.error("❌ VERIFICATION FAILED: CrosswordBoard does NOT have ADMIN_ROLE on CrosswordPrizes.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
