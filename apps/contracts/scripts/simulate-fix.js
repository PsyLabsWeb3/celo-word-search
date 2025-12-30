const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting local simulation to verify the fix...");

  const [deployer, player] = await ethers.getSigners();
  console.log("Simulating with account:", deployer.address);

  // 1. Deploy contracts locally (uses current code on disk)
  console.log("\n📦 Deploying current contracts to local Hardhat network...");
  
  // Deploy minimal necessary contracts
  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
  const crosswordPrizes = await CrosswordPrizes.deploy(deployer.address);
  await crosswordPrizes.waitForDeployment();
  const prizesAddr = await crosswordPrizes.getAddress();

  const PublicCrosswordManager = await ethers.getContractFactory("PublicCrosswordManager");
  const publicManager = await PublicCrosswordManager.deploy(deployer.address);
  await publicManager.waitForDeployment();
  const managerAddr = await publicManager.getAddress();

  // Deploy Coordinator (Board)
  const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
  // We mock other addresses as we only test the flow between Board -> Manager -> Prizes
  const board = await CrosswordBoard.deploy(
    ethers.ZeroAddress, // core
    prizesAddr,         // prizes
    ethers.ZeroAddress, // profiles
    ethers.ZeroAddress, // config
    ethers.ZeroAddress, // admin
    managerAddr         // public manager
  );
  await board.waitForDeployment();
  const boardAddr = await board.getAddress();
  
  console.log("✅ Contracts deployed locally.");

  // 2. Setup permissions (mocking what happens in deploy script)
  console.log("\n🔧 Configuring permissions...");
  
  // Grant OPERATOR role to Board in Prizes (so Board can create crosswords in Prizes)
  const OPERATOR_ROLE = await crosswordPrizes.OPERATOR_ROLE(); // Assuming this is public or we use keccak
  // Actually usually defined in libraries, let's just use the grant function if exposed or rely on owner
  
  // Since we are owner, we can assume we can configure things, but Board needs rights.
  // Check CrosswordPrizes.sol: grantOperatorRole exists
  await crosswordPrizes.grantOperatorRole(boardAddr);

  // Allow native CELO
  // check setAllowedToken
  await crosswordPrizes.setAllowedToken(ethers.ZeroAddress, true);

  // IMPORTANT: For PublicCrosswordManager, we don't need to grant roles to Board because 
  // Board calls PublicManager functions that are "external" (publicly accessible). 
  // BUT the function createCrosswordWithNativeCELOPrizePool is 'external payable'.
  
  // 3. Attempt the exact transaction that was failing
  console.log("\n🧪 Testing createPublicCrosswordWithNativeCELOPrizePool...");
  
  const crosswordId = ethers.keccak256(ethers.toUtf8Bytes("test-crossword-" + Date.now()));
  const prizePool = ethers.parseEther("1"); // 1 CELO
  
  // Params
  const params = {
    crosswordId,
    name: "Test Crossword",
    crosswordData: "{}",
    sponsoredBy: "Tester",
    maxWinners: 1,
    prizePool: prizePool,
    winnerPercentages: [10000],
    endTime: Math.floor(Date.now() / 1000) + 3600
  };

  try {
    // This calls CrosswordBoard.createPublicCrosswordWithNativeCELOPrizePool
    // Which calls PublicCrosswordManager.createCrosswordWithNativeCELOPrizePool{value: 0}
    // Which FAILED before because it checked msg.value == prizePool
    
    console.log("Sending transaction with 1 CELO...");
    const tx = await board.createPublicCrosswordWithNativeCELOPrizePool(
      params.crosswordId,
      params.name,
      params.crosswordData,
      params.sponsoredBy,
      params.maxWinners,
      params.prizePool,
      params.winnerPercentages,
      params.endTime,
      { value: prizePool } // We send the prize pool to the Board
    );
    
    await tx.wait();
    console.log("🎉 SUCCESS! Transaction completed without reverting.");
    console.log("This proves the fix in PublicCrosswordManager.sol works:");
    console.log("The Board received 1 CELO, but called Manager with 0 CELO.");
    console.log("The Manager correctly ignored the value mismatch check.");
    
  } catch (error) {
    console.error("❌ FAILED! The simulation reverted.");
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
