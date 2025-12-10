const hre = require("hardhat");

async function main() {
  const crosswordBoardAddress = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const expectedOwner = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";

  console.log("Checking owner of CrosswordBoard contract...");
  console.log(`CrosswordBoard Address: ${crosswordBoardAddress}`);

  // Get CrosswordBoard contract instance
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Read the owner
  const actualOwner = await crosswordBoard.read.owner();
  console.log(`Stored owner address: ${actualOwner}`);
  console.log(`Expected owner address: ${expectedOwner}`);

  if (actualOwner.toLowerCase() === expectedOwner.toLowerCase()) {
    console.log("✅ The expected address is the owner.");
  } else {
    console.error("❌ ERROR: The expected address is NOT the owner.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
