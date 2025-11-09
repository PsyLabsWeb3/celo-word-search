// Script to check admin status for both wallets
const hre = require("hardhat");

async function main() {
  // The wallets to check
  const mainAdminWallet = "0x0c9Adb5b5483130F88F10DB4978772986B1E953B";
  const deployerWallet = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

  // Get deployed contract addresses from environment variables
  const CROSSWORD_BOARD_ADDRESS = process.env.CROSSWORD_BOARD_ADDRESS || "YOUR_CROSSWORD_BOARD_ADDRESS";
  const CROSSWORD_PRIZES_ADDRESS = process.env.CROSSWORD_PRIZES_ADDRESS || "YOUR_CROSSWORD_PRIZES_ADDRESS";

  if (!CROSSWORD_BOARD_ADDRESS || CROSSWORD_BOARD_ADDRESS === "YOUR_CROSSWORD_BOARD_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_BOARD_ADDRESS environment variable with your deployed contract address");
    return;
  }

  if (!CROSSWORD_PRIZES_ADDRESS || CROSSWORD_PRIZES_ADDRESS === "YOUR_CROSSWORD_PRIZES_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_PRIZES_ADDRESS environment variable with your deployed contract address");
    return;
  }

  console.log("CrosswordBoard contract address:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract address:", CROSSWORD_PRIZES_ADDRESS);

  // Get contract instances
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  console.log("\n--- Checking admin status for main admin wallet:", mainAdminWallet, "---");
  
  // Check CrosswordBoard admin status
  const boardAdminStatus1 = await crosswordBoard.read.isAdminAddress([mainAdminWallet]);
  console.log("Is admin in CrosswordBoard:", boardAdminStatus1);
  
  // Check CrosswordPrizes admin roles
  const ADMIN_ROLE = await crosswordPrizes.read.ADMIN_ROLE();
  const OPERATOR_ROLE = await crosswordPrizes.read.OPERATOR_ROLE();
  const DEFAULT_ADMIN_ROLE = await crosswordPrizes.read.DEFAULT_ADMIN_ROLE();
  
  const adminRoleStatus1 = await crosswordPrizes.read.hasRole([ADMIN_ROLE, mainAdminWallet]);
  const operatorRoleStatus1 = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, mainAdminWallet]);
  const defaultAdminRoleStatus1 = await crosswordPrizes.read.hasRole([DEFAULT_ADMIN_ROLE, mainAdminWallet]);
  
  console.log("Has ADMIN_ROLE in CrosswordPrizes:", adminRoleStatus1);
  console.log("Has OPERATOR_ROLE in CrosswordPrizes:", operatorRoleStatus1);
  console.log("Has DEFAULT_ADMIN_ROLE in CrosswordPrizes:", defaultAdminRoleStatus1);

  console.log("\n--- Checking admin status for deployer wallet:", deployerWallet, "---");
  
  // Check CrosswordBoard admin status
  const boardAdminStatus2 = await crosswordBoard.read.isAdminAddress([deployerWallet]);
  console.log("Is admin in CrosswordBoard:", boardAdminStatus2);
  
  // Check CrosswordPrizes admin roles
  const adminRoleStatus2 = await crosswordPrizes.read.hasRole([ADMIN_ROLE, deployerWallet]);
  const operatorRoleStatus2 = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, deployerWallet]);
  const defaultAdminRoleStatus2 = await crosswordPrizes.read.hasRole([DEFAULT_ADMIN_ROLE, deployerWallet]);
  
  console.log("Has ADMIN_ROLE in CrosswordPrizes:", adminRoleStatus2);
  console.log("Has OPERATOR_ROLE in CrosswordPrizes:", operatorRoleStatus2);
  console.log("Has DEFAULT_ADMIN_ROLE in CrosswordPrizes:", defaultAdminRoleStatus2);

  console.log("\n--- Role Hashes ---");
  console.log("ADMIN_ROLE:", ADMIN_ROLE);
  console.log("OPERATOR_ROLE:", OPERATOR_ROLE);
  console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });