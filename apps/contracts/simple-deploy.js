// Simple test deployment
async function main() {
  const hre = require("hardhat");
  
  console.log("Deploying CrosswordCore contract...");
  
  // Get the deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", await deployer.getAddress());
  
  // Get contract factory
  const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
  
  // Deploy the contract
  const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
  await crosswordCore.waitForDeployment();
  
  console.log("CrosswordCore deployed to:", await crosswordCore.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });