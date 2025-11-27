const hre = require("hardhat");

async function main() {
  console.log("Granting admin permissions...");

  // Get wallet client
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  // Addresses of deployed contracts
  const crosswordBoardAddress = "0xeC4Fa060BCE3f1021517b9dD4e7f942cF59d5622";
  const crosswordPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";

  // Get CrosswordPrizes contract instance using ethers
  const crosswordPrizesEthers = await hre.ethers.getContractAt("CrosswordPrizes", crosswordPrizesAddress);
  
  // Get ADMIN_ROLE
  const ADMIN_ROLE = await crosswordPrizesEthers.ADMIN_ROLE();
  console.log("ADMIN_ROLE:", ADMIN_ROLE);

  // Check if CrosswordBoard already has admin role
  const hasRole = await crosswordPrizesEthers.hasRole(ADMIN_ROLE, crosswordBoardAddress);
  console.log("CrosswordBoard already has admin role?", hasRole);

  if (!hasRole) {
    console.log(`Granting admin role to CrosswordBoard (${crosswordBoardAddress})...`);
    
    const tx = await crosswordPrizesEthers.grantRole(ADMIN_ROLE, crosswordBoardAddress);
    console.log("Transaction sent with hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("✅ Admin role granted successfully!");
  } else {
    console.log("CrosswordBoard already has admin role, no need to grant");
  }

  console.log("✅ Admin permissions setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error granting permissions:", error);
    process.exit(1);
  });