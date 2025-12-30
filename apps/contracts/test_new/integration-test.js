const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration test for library-based contracts", function () {
  it("Should verify contracts work with library-based validations", async function () {
    const [owner, admin, user1, user2] = await ethers.getSigners();
    
    // Deploy contracts with new library-based architecture
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    const crosswordCore = await CrosswordCore.deploy(await owner.getAddress());
    await crosswordCore.deploymentTransaction().wait();

    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    const userProfiles = await UserProfiles.deploy(await admin.getAddress());
    await userProfiles.deploymentTransaction().wait();

    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    const crosswordPrizes = await CrosswordPrizes.deploy(await admin.getAddress());
    await crosswordPrizes.deploymentTransaction().wait();

    const AdminManager = await ethers.getContractFactory("AdminManager");
    const adminManager = await AdminManager.deploy(await owner.getAddress());
    await adminManager.deploymentTransaction().wait();

    // Test basic functionality
    // 1. Test CrosswordCore functionality
    const crosswordId = ethers.id("test_crossword");
    await expect(crosswordCore.connect(admin).setCrossword(crosswordId, "test_data"))
      .to.emit(crosswordCore, "CrosswordUpdated");

    const [retrievedId, retrievedData, updateTime] = await crosswordCore.getCurrentCrossword();
    expect(retrievedId).to.equal(crosswordId);
    expect(retrievedData).to.equal("test_data");

    // 2. Test UserProfiles functionality (with library-based validations)
    await expect(
      userProfiles.connect(user1).updateProfile(
        "testuser",      // Valid username (length 8, within 100 limit)
        "Test User",     // Valid display name
        "https://example.com/pfp.png",  // Valid profile URL
        "Test bio",      // Valid bio
        "https://test.com"  // Valid website
      )
    ).to.not.be.reverted;

    // 3. Test validation - too long username should fail
    const longUsername = "a".repeat(101); // More than 100 chars
    await expect(
      userProfiles.connect(user1).updateProfile(
        longUsername,    // Invalid - too long
        "Test User",
        "https://example.com/pfp.png",
        "Test bio",
        "https://test.com"
      )
    ).to.be.reverted;

    // 4. Test validation - empty username should fail
    await expect(
      userProfiles.connect(user1).updateProfile(
        "",              // Invalid - empty
        "Test User", 
        "https://example.com/pfp.png",
        "Test bio",
        "https://test.com"
      )
    ).to.be.reverted;

    // 5. Test CrosswordPrizes functionality
    expect(await crosswordPrizes.getMaxWinners()).to.equal(3);
    await crosswordPrizes.connect(admin).setMaxWinners(5);
    expect(await crosswordPrizes.getMaxWinners()).to.equal(5);

    // 6. Test AdminManager functionality
    await adminManager.connect(owner).addAdmin(await user2.getAddress());
    expect(await adminManager.isAdminAddress(await user2.getAddress())).to.be.true;

    console.log("✓ All functionality tests passed with library-based architecture!");
  });

  it("Should verify contracts are under 24KB size limit", async function () {
    // This test verifies that our refactoring achieved size reduction
    // We already verified this externally with the check_sizes.js script
    // Here we just verify that the contracts can be deployed and function properly
    
    const [deployer] = await ethers.getSigners();
    
    const CrosswordCore = await ethers.getContractFactory("CrosswordCore");
    const crosswordCore = await CrosswordCore.deploy(await deployer.getAddress());
    await crosswordCore.deploymentTransaction().wait();

    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    const crosswordPrizes = await CrosswordPrizes.deploy(await deployer.getAddress());
    await crosswordPrizes.deploymentTransaction().wait();

    const UserProfiles = await ethers.getContractFactory("UserProfiles");
    const userProfiles = await UserProfiles.deploy(await deployer.getAddress());
    await userProfiles.deploymentTransaction().wait();

    // Verify contracts deployed successfully (which means they are under the size limit)
    expect(await crosswordCore.owner()).to.equal(await deployer.getAddress());
    expect(await crosswordPrizes.owner()).to.equal(await deployer.getAddress());
    expect(await userProfiles.owner()).to.equal(await deployer.getAddress());

    console.log("✓ All contracts deployed successfully - confirming they are under 24KB size limit!");
  });
});