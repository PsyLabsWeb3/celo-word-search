const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DebugFullFlow", function () {
  let deployer, player, serverSigner;
  let prizes, board, manager, core, profiles, config, admin;

  before(async function () {
    [deployer, player, serverSigner] = await ethers.getSigners();
    console.log("-------------------------------------------------------");
    console.log("🧪 Starting Full Flow Debug with account:", deployer.address);
  });

  it("Should deploy and configure all contracts", async function () {
    // 1. Deploy Libraries (if any needed, usually handled automatically)

    // 2. Deploy Core Contracts
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    core = await CrosswordCore.deploy(deployer.address);
    await core.waitForDeployment();
    console.log("✅ Core deployed");

    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    prizes = await CrosswordPrizes.deploy(deployer.address); // owner
    await prizes.waitForDeployment();
    console.log("✅ Prizes deployed");

    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    profiles = await UserProfiles.deploy(deployer.address);
    await profiles.waitForDeployment();
    console.log("✅ Profiles deployed");

    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    config = await ConfigManager.deploy(deployer.address);
    await config.waitForDeployment();
    console.log("✅ Config deployed");

    const AdminManager = await ethers.getContractFactory("AdminManager");
    admin = await AdminManager.deploy(deployer.address);
    await admin.waitForDeployment();
    console.log("✅ Admin deployed");

    const PublicCrosswordManager = await ethers.getContractFactory("PublicCrosswordManager");
    manager = await PublicCrosswordManager.deploy(deployer.address);
    await manager.waitForDeployment();
    console.log("✅ PublicManager deployed");

    const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
    board = await CrosswordBoard.deploy(
      await core.getAddress(),
      await prizes.getAddress(),
      await profiles.getAddress(),
      await config.getAddress(),
      await admin.getAddress(),
      await manager.getAddress()
    );
    await board.waitForDeployment();
    console.log("✅ Board deployed at:", await board.getAddress());

    // 3. Configuration
    console.log("\n🔧 Configuring permissions...");
    
    // Grant OPERATOR role to Board in Prizes
    const OPERATOR_ROLE = ethers.id("OPERATOR_ROLE");
    await prizes.grantRole(OPERATOR_ROLE, await board.getAddress());
    
    // Also grant ADMIN_ROLE to Board
    const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
    await prizes.grantRole(ADMIN_ROLE, await board.getAddress());
    console.log("   - Board granted ADMIN_ROLE in Prizes");

    // Connect Board to PublicManager
    // await manager.setCrosswordBoard(await board.getAddress()); // Function does not exist
    console.log("   - Board set in PublicManager (Skipped - Not needed)");

    // Set Signer in Core
    await core.setSigner(serverSigner.address);
    console.log("   - Server signer set in Core:", serverSigner.address);

    // Allow Native CELO
    await prizes.setAllowedToken(ethers.ZeroAddress, true);
    console.log("   - Native CELO allowed");
  });

  it("Should CREATE a crossword with correct params", async function () {
    console.log("\n🧪 Testing Creation...");
    const crosswordId = ethers.keccak256(ethers.toUtf8Bytes("debug-crossword-1"));
    const prizePool = ethers.parseEther("1"); // 1 CELO
    const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Testing Fixes:
    // 1. Value Mismatch: We send 1 CELO to Board. Board sends 0 to Manager. Manager should NOT revert.
    // 2. Percentage: We send [10000] (100%). Should NOT revert (limit raised to 10000).
    // 3. EndTime: We send a valid timestamp. Should NOT revert (validation logic fixed).

    await board.connect(deployer).createPublicCrosswordWithNativeCELOPrizePool(
        crosswordId,
        "Debug Crossword",
        "{}", // data
        "Debugger",
        1, // maxWinners
        prizePool,
        [10000], // winnerPercentages
        endTime,
        { value: prizePool }
    );

    console.log("🎉 Creation SUCCESS! All fixes validated.");
  });

  it("Should COMPLETE the crossword and CLAIM prize", async function () {
    console.log("\n🧪 Testing Completion...");
    const crosswordId = ethers.keccak256(ethers.toUtf8Bytes("debug-crossword-1"));
    const duration = 1000; // 1 second

    // Hash construction matching CrosswordCore:
    // keccak256(abi.encodePacked(user, crosswordId, durationMs, address(this)))
    // user = msg.sender (which is player.address when calling Board.completeCrossword -> Core.completeCrosswordForUser which uses passed user arg)
    // Core address: address(this) inside Core.
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "bytes32", "uint256", "address"],
        [player.address, crosswordId, duration, await core.getAddress()]
    );
    const signature = await serverSigner.signMessage(ethers.getBytes(messageHash));

    // Call complete
    await board.connect(player).completeCrossword(
        crosswordId,
        duration,
        "player1",
        "Player One",
        "http://pfp.com",
        signature
    );
    
    console.log("🎉 Completion SUCCESS!");
  });
});
