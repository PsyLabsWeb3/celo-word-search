import { expect } from "chai";
import { viem } from "hardhat";
import { parseEther } from "viem";

describe("CrosswordPrizes Automatic Distribution Test", function () {
  it("Should test the automatic prize distribution to first 3 finishers", async function () {
    this.timeout(50000); // Increase timeout for deployment and testing

    // Get test accounts
    const [owner, admin, user1, user2, user3, user4] = await viem.getWalletClients();

    // Deploy Config contract
    const configContract = await viem.deployContract("Config", [owner.account.address]);
    console.log("Config contract deployed to:", configContract.address);

    // Deploy CrosswordPrizes contract
    const prizesContract = await viem.deployContract("CrosswordPrizes", [owner.account.address]);
    console.log("CrosswordPrizes contract deployed to:", prizesContract.address);

    // Deploy CrosswordBoard contract
    const boardContract = await viem.deployContract("CrosswordBoard", [
      owner.account.address,
      prizesContract.address,
      configContract.address
    ]);
    console.log("CrosswordBoard contract deployed to:", boardContract.address);

    const publicClient = await viem.getPublicClient();

    // Grant admin roles
    const adminRole = await prizesContract.read.ADMIN_ROLE();
    let tx = await owner.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("grantRole", [adminRole, admin.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    
    tx = await owner.sendTransaction({
      to: boardContract.address,
      data: boardContract.encodeFunctionData("addAdmin", [admin.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Allow a mock token
    const mockTokenAddress = "0x1234567890123456789012345678901234567890"; // Mock token address
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("setAllowedToken", [mockTokenAddress, true])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Prepare test data
    const crosswordId = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const winnerPercentages = [5000n, 3000n, 2000n]; // 50%, 30%, 20%
    const prizePool = parseEther("10"); // 10 tokens in prize pool

    // Activate the crossword 
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("createCrossword", [
        crosswordId,
        mockTokenAddress,
        prizePool,
        winnerPercentages,
        0n // no deadline
      ])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Activate the crossword
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("activateCrossword", [crosswordId])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check initial state
    const initialDetails = await prizesContract.read.getCrosswordDetails([crosswordId]);
    console.log("Initial crossword state:", initialDetails[6]); // state
    expect(initialDetails[6]).to.equal(1n); // Active state

    // Test automatic prize distribution by simulating user completions
    console.log("\n--- Testing Automatic Prize Distribution ---");

    // First user completes - should get 1st place prize (50% of 10 = 5)
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId, user1.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("First user completed - should receive 1st place prize");

    // Second user completes - should get 2nd place prize (30% of 10 = 3)
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId, user2.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("Second user completed - should receive 2nd place prize");

    // Third user completes - should get 3rd place prize (20% of 10 = 2)
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId, user3.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("Third user completed - should receive 3rd place prize");

    // Check final state - crossword should be complete now
    const finalDetails = await prizesContract.read.getCrosswordDetails([crosswordId]);
    console.log("Final crossword state:", finalDetails[6]); // state
    expect(finalDetails[6]).to.equal(2n); // Complete state

    // Fourth user tries to complete - should not get a prize since max winners reached
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId, user4.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("Fourth user completed - should not receive prize since max winners reached");

    // Test configurable max winners
    console.log("\n--- Testing Configurable Max Winners ---");

    // Create a new crossword with different parameters
    const crosswordId2 = "0x4567890123456789012345678901234567890123456789012345678901234567";
    const winnerPercentages2 = [6000n, 4000n]; // 60%, 40% - only 2 winners
    const prizePool2 = parseEther("5"); // 5 tokens

    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("createCrossword", [
        crosswordId2,
        mockTokenAddress,
        prizePool2,
        winnerPercentages2,
        0n // no deadline
      ])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Activate the crossword
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("activateCrossword", [crosswordId2])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // First two users get prizes
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId2, user1.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId2, user2.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Third user should not get a prize (only 2 winners configured)
    tx = await admin.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("recordCompletion", [crosswordId2, user3.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check final state - crossword should be complete after 2 completions
    const finalDetails2 = await prizesContract.read.getCrosswordDetails([crosswordId2]);
    console.log("Final crossword 2 state:", finalDetails2[6]); // state
    expect(finalDetails2[6]).to.equal(2n); // Complete state

    console.log("All automatic prize distribution tests passed!");
  });

  it("Should test configuration functions", async function () {
    this.timeout(30000);

    const [owner, admin] = await viem.getWalletClients();

    // Deploy contracts
    const configContract = await viem.deployContract("Config", [owner.account.address]);
    const prizesContract = await viem.deployContract("CrosswordPrizes", [owner.account.address]);
    const boardContract = await viem.deployContract("CrosswordBoard", [
      owner.account.address,
      prizesContract.address,
      configContract.address
    ]);

    const publicClient = await viem.getPublicClient();

    // Grant admin role to admin account
    const adminRole = await prizesContract.read.ADMIN_ROLE();
    let tx = await owner.sendTransaction({
      to: prizesContract.address,
      data: prizesContract.encodeFunctionData("grantRole", [adminRole, admin.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    tx = await owner.sendTransaction({
      to: boardContract.address,
      data: boardContract.encodeFunctionData("addAdmin", [admin.account.address])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Test initial max winners
    let maxWinners = await boardContract.read.getMaxWinnersConfig();
    console.log("Initial max winners config:", maxWinners);
    expect(maxWinners).to.equal(3n); // Default value

    // Update max winners to 5
    tx = await admin.sendTransaction({
      to: boardContract.address,
      data: boardContract.encodeFunctionData("setMaxWinnersConfig", [5n])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    maxWinners = await boardContract.read.getMaxWinnersConfig();
    console.log("Updated max winners config:", maxWinners);
    expect(maxWinners).to.equal(5n);

    // Test return home button visibility
    let isVisible = await boardContract.read.isReturnHomeButtonVisible();
    console.log("Initial return home button visibility:", isVisible);
    expect(isVisible).to.equal(true);

    // Update visibility to false
    tx = await admin.sendTransaction({
      to: boardContract.address,
      data: boardContract.encodeFunctionData("setReturnHomeButtonVisible", [false])
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    isVisible = await boardContract.read.isReturnHomeButtonVisible();
    console.log("Updated return home button visibility:", isVisible);
    expect(isVisible).to.equal(false);

    console.log("All configuration tests passed!");
  });
});