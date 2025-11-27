const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crossword Full Flow Test", function () {
  // Use larger timeout for complex operations
  this.timeout(50000);

  let crosswordBoard;
  let crosswordPrizes;
  let configContract;
  let deployer;
  let admin;
  let user1, user2, user3;

  beforeEach(async function () {
    [deployer, admin, user1, user2, user3] = await ethers.getSigners();

    // Deploy Config contract
    const Config = await ethers.getContractFactory("Config");
    configContract = await Config.deploy(deployer.address);

    // Deploy CrosswordPrizes contract
    const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
    crosswordPrizes = await CrosswordPrizes.deploy(deployer.address);

    // Deploy CrosswordBoard contract with proper addresses
    const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
    crosswordBoard = await CrosswordBoard.deploy(
      deployer.address,
      await crosswordPrizes.getAddress(),
      await configContract.getAddress()
    );

    // Grant admin role on CrosswordPrizes
    const ADMIN_ROLE = await crosswordPrizes.ADMIN_ROLE();
    await crosswordPrizes.grantRole(ADMIN_ROLE, admin);
    
    // Grant operator role to CrosswordBoard so it can call recordCompletion
    const OPERATOR_ROLE = await crosswordPrizes.OPERATOR_ROLE();
    await crosswordPrizes.grantRole(OPERATOR_ROLE, await crosswordBoard.getAddress());
    
    // Add admin to CrosswordBoard
    await crosswordBoard.addAdmin(admin);

    // Allow native CELO in CrosswordPrizes
    await crosswordPrizes.setAllowedToken(ethers.ZeroAddress, true);
  });

  it("Should successfully execute the full crossword flow with native CELO", async function () {
    // Test data
    const crosswordId = ethers.keccak256(ethers.toUtf8Bytes("test-crossword-full"));
    const crosswordData = JSON.stringify({
      grid: [
        ["C", "E", "L", "O"],
        ["R", "U", "N", "I"],
        ["O", "S", "T", "M"],
        ["S", "E", "P", "O"]
      ],
      clues: {
        across: [
          { number: 1, clue: "Celo blockchain token" },
          { number: 2, clue: "Start to run" },
          { number: 3, clue: "Computer server" },
          { number: 4, clue: "Celo testnet" }
        ],
        down: [
          { number: 1, clue: "Currency" },
          { number: 2, clue: "Not up" },
          { number: 3, clue: "Time of day" },
          { number: 5, clue: "Opposite of 'old'" }
        ]
      }
    });
    
    const prizePool = ethers.parseEther("10"); // 10 CELO
    const winnerPercentages = [6000, 3000, 1000]; // 60%, 30%, 10%
    const newMaxWinners = 3;
    const endTime = 0; // No deadline

    // Get initial balances
    const initialPrizesBalance = await ethers.provider.getBalance(await crosswordPrizes.getAddress());

    // Create crossword with native CELO prize pool
    await expect(
      crosswordBoard.connect(admin).createCrosswordWithNativeCELOPrizePool(
        crosswordId,
        crosswordData,
        newMaxWinners,
        prizePool,
        winnerPercentages,
        endTime,
        { value: prizePool }
      )
    ).to.changeEtherBalance(crosswordPrizes, prizePool);

    // Verify crossword was created in CrosswordPrizes
    const crosswordDetails = await crosswordPrizes.getCrosswordDetails(crosswordId);
    expect(crosswordDetails.token).to.equal(ethers.ZeroAddress); // Native CELO
    expect(crosswordDetails.totalPrizePool).to.equal(prizePool);
    expect(crosswordDetails.winnerPercentages).to.deep.equal(winnerPercentages);
    expect(crosswordDetails.state).to.equal(0); // Inactive

    // Activate the crossword
    await expect(crosswordBoard.connect(admin).activateCrosswordInPrizes(crosswordId))
      .to.emit(crosswordPrizes, "CrosswordActivated")
      .withArgs(crosswordId, await ethers.provider.getBlock("latest").then(b => b.timestamp));

    // Verify crossword is now active
    const updatedDetails = await crosswordPrizes.getCrosswordDetails(crosswordId);
    expect(updatedDetails.state).to.equal(1); // Active

    // Get balances before completions
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    const user2BalanceBefore = await ethers.provider.getBalance(user2.address);
    const user3BalanceBefore = await ethers.provider.getBalance(user3.address);

    // Users complete the crossword (first 3 finishers should get prizes)
    const duration1 = 300000; // 5 minutes
    const duration2 = 320000; // 5 min 20 sec
    const duration3 = 340000; // 5 min 40 sec

    await expect(
      crosswordBoard.connect(user1).completeCrossword(
        duration1,
        "user1",
        "User 1",
        "https://example.com/pfp1"
      )
    ).to.emit(crosswordPrizes, "PrizeDistributed");

    await expect(
      crosswordBoard.connect(user2).completeCrossword(
        duration2,
        "user2",
        "User 2", 
        "https://example.com/pfp2"
      )
    ).to.emit(crosswordPrizes, "PrizeDistributed");

    await expect(
      crosswordBoard.connect(user3).completeCrossword(
        duration3,
        "user3",
        "User 3",
        "https://example.com/pfp3"
      )
    ).to.emit(crosswordPrizes, "PrizeDistributed");

    // Get balances after completions
    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
    const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
    const user3BalanceAfter = await ethers.provider.getBalance(user3.address);

    // Verify that users received prizes
    // First place: 60% of 10 CELO = 6 CELO
    // Second place: 30% of 10 CELO = 3 CELO  
    // Third place: 10% of 10 CELO = 1 CELO
    const prize1 = ethers.parseEther("6");
    const prize2 = ethers.parseEther("3");
    const prize3 = ethers.parseEther("1");

    expect(user1BalanceAfter).to.equal(user1BalanceBefore + prize1);
    expect(user2BalanceAfter).to.equal(user2BalanceBefore + prize2);
    expect(user3BalanceAfter).to.equal(user3BalanceBefore + prize3);

    // Verify winners are recorded correctly
    expect(await crosswordPrizes.isWinner(crosswordId, user1.address)).to.be.true;
    expect(await crosswordPrizes.isWinner(crosswordId, user2.address)).to.be.true;
    expect(await crosswordPrizes.isWinner(crosswordId, user3.address)).to.be.true;

    expect(await crosswordPrizes.getUserRank(crosswordId, user1.address)).to.equal(1);
    expect(await crosswordPrizes.getUserRank(crosswordId, user2.address)).to.equal(2);
    expect(await crosswordPrizes.getUserRank(crosswordId, user3.address)).to.equal(3);

    // Verify crossword state is complete after 3 winners (max winners)
    const finalDetails = await crosswordPrizes.getCrosswordDetails(crosswordId);
    expect(finalDetails.state).to.equal(2); // Complete
  });

  it("Should work with ERC20 tokens as well", async function () {
    // Deploy an example ERC20 token for testing
    const TestToken = await ethers.getContractFactory("ERC20");
    const testToken = await TestToken.deploy("Test Token", "TEST");
    await testToken.waitForDeployment();
    
    // Mint tokens to admin
    await testToken.mint(admin.address, ethers.parseEther("1000"));
    
    // Approve CrosswordBoard to spend tokens
    await testToken.connect(admin).approve(await crosswordBoard.getAddress(), ethers.parseEther("100"));

    // Allow this token in CrosswordPrizes
    await crosswordPrizes.setAllowedToken(await testToken.getAddress(), true);

    // Test data with ERC20 token
    const crosswordId = ethers.keccak256(ethers.toUtf8Bytes("test-crossword-erc20"));
    const crosswordData = JSON.stringify({ test: "erc20" });
    const prizePool = ethers.parseEther("50"); // 50 TEST tokens
    const winnerPercentages = [5000, 3000, 2000]; // 50%, 30%, 20%
    const newMaxWinners = 3;
    const endTime = 0;

    // Create crossword with ERC20 prize pool
    await expect(
      crosswordBoard.connect(admin).createCrosswordWithPrizePool(
        crosswordId,
        crosswordData,
        newMaxWinners,
        await testToken.getAddress(),
        prizePool,
        winnerPercentages,
        endTime
      )
    ).to.changeTokenBalance(testToken, crosswordPrizes, prizePool);

    // Activate the crossword
    await crosswordBoard.connect(admin).activateCrosswordInPrizes(crosswordId);

    // Users complete the crossword
    await expect(
      crosswordBoard.connect(user1).completeCrossword(
        300000,
        "user1",
        "User 1",
        "https://example.com/pfp1"
      )
    ).to.emit(crosswordPrizes, "PrizeDistributed");

    // Verify user1 received ERC20 tokens
    const prize1 = (prizePool * 5000n) / 10000n; // 50% of prize pool
    expect(await testToken.balanceOf(user1.address)).to.equal(prize1);
  });
});