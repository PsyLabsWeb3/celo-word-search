// A Hardhat task to deploy contracts
require("@nomicfoundation/hardhat-toolbox-viem");

task("simple-deploy", "Simple deployment test")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying CrosswordCore contract...");
    
    // Get the deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", await deployer.getAddress());
    
    // Get balance
    const balance = await hre.ethers.provider.getBalance(await deployer.getAddress());
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "CELO");
    
    // Get contract factory
    const CrosswordCore = await hre.ethers.getContractFactory("CrosswordCore");
    
    // Deploy the contract
    const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
    await crosswordCore.waitForDeployment();
    
    console.log("CrosswordCore deployed to:", await crosswordCore.getAddress());
  });

module.exports = {};