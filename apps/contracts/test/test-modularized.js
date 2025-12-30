// Test script for modularized architecture
const { expect } = require("chai");

describe("Modularized Crossword Contracts", function () {
  let crosswordCore, crosswordPrizes, userProfiles, configManager, adminManager, crosswordBoard;
  let owner, admin, user1, user2;

  beforeEach(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();

    // Deploy all modular contracts
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    crosswordCore = await CrosswordCore.deploy(owner.address);
    await crosswordCore.deployed();

    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    crosswordPrizes = await CrosswordPrizes.deploy(owner.address);
    await crosswordPrizes.deployed();

    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    userProfiles = await UserProfiles.deploy(owner.address);
    await userProfiles.deployed();

    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    configManager = await ConfigManager.deploy(owner.address);
    await configManager.deployed();

    const AdminManager = await ethers.getContractFactory("AdminManager");
    adminManager = await AdminManager.deploy(owner.address);
    await adminManager.deployed();

    // Deploy coordinator contract
    const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
    crosswordBoard = await CrosswordBoard.deploy(
      crosswordCore.address,
      crosswordPrizes.address,
      userProfiles.address,
      configManager.address,
      adminManager.address
    );
    await crosswordBoard.deployed();
  });

  describe("CrosswordCore", function () {
    it("Should set and get crossword", async function () {
      const crosswordId = ethers.utils.id("test-crossword");
      const crosswordData = "test-crossword-data";

      await expect(crosswordCore.connect(admin).setCrossword(crosswordId, crosswordData))
        .to.emit(crosswordCore, "CrosswordUpdated");

      const [id, data, timestamp] = await crosswordCore.getCurrentCrossword();
      expect(id).to.equal(crosswordId);
      expect(data).to.equal(crosswordData);
    });
  });

  describe("UserProfiles", function () {
    it("Should update and get user profile", async function () {
      const username = "testuser";
      const displayName = "Test User";
      const pfpUrl = "https://example.com/pfp.jpg";

      await userProfiles.connect(user1).updateProfile(username, displayName, pfpUrl, "", "");

      const [uname, dname, pfp, time] = await userProfiles.getUserProfile(user1.address);
      expect(uname).to.equal(username);
      expect(dname).to.equal(displayName);
      expect(pfp).to.equal(pfpUrl);
    });
  });

  describe("ConfigManager", function () {
    it("Should set and get config values", async function () {
      const key = "test-config";
      const value = "test-value";

      await configManager.connect(admin).setStringConfig(key, value);

      const retrievedValue = await configManager.getStringConfig(key);
      expect(retrievedValue).to.equal(value);
    });
  });

  describe("AdminManager", function () {
    it("Should add and remove admins", async function () {
      // Initially, user1 should not be an admin
      expect(await adminManager.isAdminAddress(user1.address)).to.be.false;

      // Add user1 as admin
      await adminManager.connect(owner).addAdmin(user1.address);
      expect(await adminManager.isAdminAddress(user1.address)).to.be.true;

      // Remove user1 as admin
      await adminManager.connect(owner).removeAdmin(user1.address);
      expect(await adminManager.isAdminAddress(user1.address)).to.be.false;
    });
  });

  describe("CrosswordPrizes", function () {
    it("Should create and activate a crossword with prize", async function () {
      const crosswordId = ethers.utils.id("prize-crossword");
      const prizePool = ethers.utils.parseEther("1.0");
      const winnerPercentages = [5000, 3000, 2000]; // 50%, 30%, 20%
      const endTime = 0; // No deadline

      // Create crossword (using native CELO)
      await expect(crosswordPrizes.connect(admin)
        .createCrosswordWithNativeCELO(crosswordId, prizePool, winnerPercentages, endTime, { value: prizePool }))
        .to.emit(crosswordPrizes, "CrosswordCreated");

      // Activate crossword
      await expect(crosswordPrizes.connect(admin).activateCrossword(crosswordId))
        .to.emit(crosswordPrizes, "CrosswordActivated");
    });
  });

  describe("CrosswordBoard (coordinator)", function () {
    it("Should coordinate between modules", async function () {
      // Test that the coordinator contract can interact with its modules
      const crosswordId = ethers.utils.id("coordinated-crossword");
      const crosswordData = "coordinated-crossword-data";

      // Set crossword via coordinator
      await expect(crosswordBoard.connect(admin).setCrossword(crosswordId, crosswordData))
        .to.emit(crosswordCore, "CrosswordUpdated");

      // Get crossword via coordinator
      const [id, data, timestamp] = await crosswordBoard.getCurrentCrossword();
      expect(id).to.equal(crosswordId);
      expect(data).to.equal(crosswordData);
    });
  });
});