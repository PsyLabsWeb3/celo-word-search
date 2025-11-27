const hre = require("hardhat");

async function main() {
  const crosswordBoardAddress = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const crosswordPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";

  console.log("Granting ADMIN_ROLE from CrosswordPrizes to CrosswordBoard...");
  console.log(`Prizes Contract: ${crosswordPrizesAddress}`);
  console.log(`Board Contract: ${crosswordBoardAddress}`);

  // Get CrosswordPrizes contract instance using viem
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", crosswordPrizesAddress);

  // Get ADMIN_ROLE
  const ADMIN_ROLE = await crosswordPrizes.read.ADMIN_ROLE();
  console.log("ADMIN_ROLE hash:", ADMIN_ROLE);

  // Check if CrosswordBoard already has the admin role
  const hasRole = await crosswordPrizes.read.hasRole([ADMIN_ROLE, crosswordBoardAddress]);

  if (!hasRole) {
    console.log("CrosswordBoard does not have ADMIN_ROLE. Granting...");
    const tx = await crosswordPrizes.write.grantRole([ADMIN_ROLE, crosswordBoardAddress]);
    console.log("✅ ADMIN_ROLE granted successfully to CrosswordBoard.");
    console.log(`Transaction hash: ${tx}`);
  } else {
    console.log("✅ CrosswordBoard already has ADMIN_ROLE.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });