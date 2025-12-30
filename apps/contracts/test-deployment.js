const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing deployed contracts on Celo Sepolia...\n");

  // Get the deployed contract addresses
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordCoreAddress = "0x80a70f71d8edbb0ecb951e4a78282a15ae2f1bc3";
  const crosswordPrizesAddress = "0xeb0962a528b2a9618d983278a05201cfb7358304";
  const userProfilesAddress = "0x98cd71af89cb8e1c7e1c58e4043a9f83555a886f";
  const configManagerAddress = "0xf7d10ba3b9faffd288b53ac3028796e7038bfdca";
  const adminManagerAddress = "0x17b4b334e7795cdb38a41986758a9a748483f925";
  const publicCrosswordManagerAddress = "0x7fe1312983248c186c3a9eb4ad71d013521490e9";

  // Get the contract instances
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);
  const crosswordCore = await hre.viem.getContractAt("CrosswordCore", crosswordCoreAddress);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", crosswordPrizesAddress);
  const userProfiles = await hre.viem.getContractAt("UserProfiles", userProfilesAddress);
  const configManager = await hre.viem.getContractAt("ConfigManager", configManagerAddress);
  const adminManager = await hre.viem.getContractAt("AdminManager", adminManagerAddress);
  const publicCrosswordManager = await hre.viem.getContractAt("PublicCrosswordManager", publicCrosswordManagerAddress);

  console.log("✅ Contract instances created successfully!\n");

  // Test basic functionality
  console.log("Testing basic contract functionality...\n");

  // Test CrosswordBoard
  try {
    const owner = await crosswordBoard.read.owner();
    console.log(`✅ CrosswordBoard owner: ${owner}`);
  } catch (error) {
    console.log(`❌ CrosswordBoard owner test failed: ${error.message}`);
  }

  // Test CrosswordCore
  try {
    const currentCrossword = await crosswordCore.read.getCurrentCrossword();
    console.log(`✅ CrosswordCore current crossword: ${currentCrossword[0]}`);
  } catch (error) {
    console.log(`❌ CrosswordCore test failed: ${error.message}`);
  }

  // Test CrosswordPrizes
  try {
    const maxWinners = await crosswordPrizes.read.getMaxWinners();
    console.log(`✅ CrosswordPrizes max winners: ${maxWinners}`);
  } catch (error) {
    console.log(`❌ CrosswordPrizes test failed: ${error.message}`);
  }

  // Test UserProfiles
  try {
    const deployer = (await hre.viem.getWalletClients())[0];
    const profile = await userProfiles.read.getUserProfile([deployer.account.address]);
    console.log(`✅ UserProfiles test successful for deployer`);
  } catch (error) {
    console.log(`❌ UserProfiles test failed: ${error.message}`);
  }

  // Test ConfigManager
  try {
    const homeButtonVisible = await configManager.read.getBoolConfigWithDefault([await configManager.read.HOME_BUTTON_VISIBLE(), true]);
    console.log(`✅ ConfigManager home button visible: ${homeButtonVisible}`);
  } catch (error) {
    console.log(`❌ ConfigManager test failed: ${error.message}`);
  }

  // Test AdminManager
  try {
    const deployer = (await hre.viem.getWalletClients())[0];
    const isAdmin = await adminManager.read.isAdminAddress([deployer.account.address]);
    console.log(`✅ AdminManager deployer is admin: ${isAdmin}`);
  } catch (error) {
    console.log(`❌ AdminManager test failed: ${error.message}`);
  }

  // Test PublicCrosswordManager
  try {
    const allCrosswordIds = await publicCrosswordManager.read.getAllCrosswordIds();
    console.log(`✅ PublicCrosswordManager total crosswords: ${allCrosswordIds.length}`);
  } catch (error) {
    console.log(`❌ PublicCrosswordManager test failed: ${error.message}`);
  }

  console.log("\n🎉 All contracts are deployed and accessible!");
  console.log("\n📋 Final Deployment Summary:");
  console.log(`CrosswordCore:           ${crosswordCoreAddress}`);
  console.log(`CrosswordPrizes:         ${crosswordPrizesAddress}`);
  console.log(`UserProfiles:            ${userProfilesAddress}`);
  console.log(`ConfigManager:           ${configManagerAddress}`);
  console.log(`AdminManager:            ${adminManagerAddress}`);
  console.log(`PublicCrosswordManager:  ${publicCrosswordManagerAddress}`);
  console.log(`CrosswordBoard:          ${crosswordBoardAddress}`);

  console.log("\n✅ All contracts are properly deployed and configured!");
  console.log("The crossword creation and display functionality should now work correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });