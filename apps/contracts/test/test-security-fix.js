const { expect } = require("chai");
const { viem } = require("hardhat");
const { keccak256, encodePacked, parseEther, getAddress, toHex } = require("viem");

describe("CrosswordBoard Security Fixes (Viem)", function () {
  async function deployFixture() {
    const [owner, admin, user1, user2, signer] = await viem.getWalletClients();
    
    // Deploy contract
    // Constructor requires initialOwner
    const crosswordBoard = await viem.deployContract("CrosswordBoard", [owner.account.address]);
    
    // Grant ADMIN_ROLE to admin
    const ADMIN_ROLE = await crosswordBoard.read.ADMIN_ROLE();
    await crosswordBoard.write.grantRole([ADMIN_ROLE, admin.account.address], { account: owner.account });
    
    // Set signer
    await crosswordBoard.write.setSigner([signer.account.address], { account: admin.account });

    return { crosswordBoard, owner, admin, user1, user2, signer };
  }

  describe("Signature Verification", function () {
    it("Should reject completion with invalid signature", async function () {
      const { crosswordBoard, admin, user1, signer } = await deployFixture();
      
      const crosswordId = "0x" + "1".repeat(64);
      const prizePool = parseEther("10"); // 10 CELO
      
      // Create crossword
      await crosswordBoard.write.createCrosswordWithNativeCELO(
        [
          crosswordId,
          "Test Crossword",
          "{}",
          "Unit Test",
          prizePool,
          [5000n, 5000n], 
          0n
        ], 
        { account: admin.account, value: prizePool }
      );
      
      await crosswordBoard.write.setCrossword([crosswordId, "{}"], { account: admin.account });
      
      const durationMs = 1000n;
      const contractAddress = getAddress(crosswordBoard.address);
      
      // INVALID signature (User1 signs instead of signer)
      // Hash: keccak256(encodePacked(msg.sender, crosswordId, durationMs, address(this)))
      // user1.account.address must be used
      const user1Address = getAddress(user1.account.address);
      
      const hash = keccak256(encodePacked(
        ["address", "bytes32", "uint256", "address"],
        [user1Address, crosswordId, durationMs, contractAddress]
      ));
      
      // Sign with WRONG wallet (user1)
      const signature = await user1.signMessage({ message: { raw: hash } });
      
      try {
        await crosswordBoard.write.completeCrossword(
          [durationMs, "user1", "User One", "http://pfp.url", signature],
          { account: user1.account }
        );
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("CrosswordBoard: invalid signature");
      }
    });

    it("Should accept completion with valid signature", async function () {
      const { crosswordBoard, admin, user1, signer } = await deployFixture();
      
      const crosswordId = "0x" + "2".repeat(64);
      const prizePool = parseEther("10");
      
      // Create crossword
      await crosswordBoard.write.createCrosswordWithNativeCELO(
        [
          crosswordId,
          "Test Crossword",
          "{}",
          "Unit Test",
          prizePool,
          [5000n, 5000n], 
          0n
        ], 
        { account: admin.account, value: prizePool }
      );
      
      await crosswordBoard.write.setCrossword([crosswordId, "{}"], { account: admin.account });
      
      const durationMs = 1000n;
      const contractAddress = getAddress(crosswordBoard.address);
      const user1Address = getAddress(user1.account.address);
      
      // Create VALID signature
      const hash = keccak256(encodePacked(
        ["address", "bytes32", "uint256", "address"],
        [user1Address, crosswordId, durationMs, contractAddress]
      ));
      
      const signature = await signer.signMessage({ message: { raw: hash } });
      
      await crosswordBoard.write.completeCrossword(
        [durationMs, "user1", "User One", "http://pfp.url", signature],
        { account: user1.account }
      );
      
      // Verify claimed
      const hasClaimed = await crosswordBoard.read.hasClaimedPrize([crosswordId, user1Address]);
      expect(hasClaimed).to.be.true;
    });

    it("Should reject replay attack (using signature for different user)", async function () {
        const { crosswordBoard, admin, user1, user2, signer } = await deployFixture();
        
        const crosswordId = "0x" + "3".repeat(64);
        const prizePool = parseEther("10");
        
        await crosswordBoard.write.createCrosswordWithNativeCELO(
            [crosswordId, "Test", "{}", "Sponsor", prizePool, [5000n, 5000n], 0n],
        { account: admin.account, value: prizePool }
      );
      
      // Set as active crossword
      await crosswordBoard.write.setCrossword([crosswordId, "{}"], { account: admin.account });
        
        const durationMs = 1000n;
        const contractAddress = getAddress(crosswordBoard.address);
        const user1Address = getAddress(user1.account.address);
        
        // Singature for USER 1
        const hash = keccak256(encodePacked(
          ["address", "bytes32", "uint256", "address"],
          [user1Address, crosswordId, durationMs, contractAddress]
        ));
        
        const signature = await signer.signMessage({ message: { raw: hash } });
        
        // User 2 tries to use User 1's signature
        try {
            await crosswordBoard.write.completeCrossword(
                [durationMs, "user2", "User Two", "http://pfp.url", signature],
                { account: user2.account }
            );
            expect.fail("Should have reverted");
        } catch (error) {
            expect(error.message).to.include("CrosswordBoard: invalid signature");
        }
    });
  });

  describe("Recovery Logic", function () {
    it("Should allow recovery after window passes", async function () {
        const { crosswordBoard, admin } = await deployFixture();
        const publicClient = await viem.getPublicClient();
        
        const crosswordId = "0x" + "4".repeat(64);
        const prizePool = parseEther("10");
        
        await crosswordBoard.write.createCrosswordWithNativeCELO(
            [crosswordId, "Zombie", "{}", "Sponsor", prizePool, [5000n, 5000n], 0n],
            { account: admin.account, value: prizePool }
        );
        
        // Fast forward 31 days (Recovery window is 30 days)
        // Check hardhat method for time travel with viem/hardhat
        // We can use network.provider
        await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
        await network.provider.send("evm_mine");
        
        // Recover
        await crosswordBoard.write.recoverUnclaimedPrizes([crosswordId], { account: admin.account });
        
        // Success if no revert
    });
    
    it("Should REJECT recovery before window passes", async function () {
        const { crosswordBoard, admin } = await deployFixture();
        
        const crosswordId = "0x" + "5".repeat(64);
        const prizePool = parseEther("10");
        
        await crosswordBoard.write.createCrosswordWithNativeCELO(
            [crosswordId, "Fresh", "{}", "Sponsor", prizePool, [5000n, 5000n], 0n],
            { account: admin.account, value: prizePool }
        );
        
        // Fast forward 1 day
        await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
        await network.provider.send("evm_mine");
        
        try {
            await crosswordBoard.write.recoverUnclaimedPrizes([crosswordId], { account: admin.account });
            expect.fail("Should have reverted");
        } catch (error) {
             expect(error.message).to.include("CrosswordBoard: recovery window not elapsed");
        }
    });
  });
});
