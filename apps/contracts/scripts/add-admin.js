const hre = require("hardhat");

async function main() {
  console.log("Adding admin to CrosswordPrizes contract...");

  // Get wallet client
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  // Addresses of deployed contracts
  const crosswordPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";
  
  // Address to add as admin
  const addressToAddAsAdmin = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";

  // Get CrosswordPrizes contract instance using ethers
  const crosswordPrizesEthers = await hre.ethers.getContractAt("CrosswordPrizes", crosswordPrizesAddress);
  
  // Get ADMIN_ROLE
  const ADMIN_ROLE = await crosswordPrizesEthers.ADMIN_ROLE();
  console.log("ADMIN_ROLE:", ADMIN_ROLE);

  // Check if address already has admin role
  const hasRole = await crosswordPrizesEthers.hasRole(ADMIN_ROLE, addressToAddAsAdmin);
  console.log("Address already has admin role?", hasRole);

  if (!hasRole) {
    console.log(`Adding admin role to address: ${addressToAddAsAdmin}...`);
    
    const tx = await crosswordPrizesEthers.grantRole(ADMIN_ROLE, addressToAddAsAdmin);
    console.log("Transaction sent with hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("✅ Admin role granted successfully!");
  } else {
    console.log("Address already has admin role, no need to grant");
  }

  console.log("✅ Admin addition process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error adding admin:", error);
    process.exit(1);
  });