// Deployment script for modularized contracts
const hre = require("hardhat");

async function main() {
  console.log("Deploying modularized contracts to Sepolia...");

  // Get the deployer account using viem
  const [deployer] = await hre.viem.getWalletClients();
  const deployerAccount = deployer.account;
  console.log("Deploying contracts with account:", deployer.account.address);

  // Deploy CrosswordCore
  console.log("\nDeploying CrosswordCore...");
  const CrosswordCore = await hre.viem.deployContract("CrosswordCore", [deployer.account.address]);
  console.log("CrosswordCore deployed to:", CrosswordCore.address);

  // Deploy CrosswordPrizes
  console.log("\nDeploying CrosswordPrizes...");
  const CrosswordPrizes = await hre.viem.deployContract("CrosswordPrizes", [deployer.account.address]);
  console.log("CrosswordPrizes deployed to:", CrosswordPrizes.address);

  // Deploy UserProfiles
  console.log("\nDeploying UserProfiles...");
  const UserProfiles = await hre.viem.deployContract("UserProfiles", [deployer.account.address]);
  console.log("UserProfiles deployed to:", UserProfiles.address);

  // Deploy ConfigManager
  console.log("\nDeploying ConfigManager...");
  const ConfigManager = await hre.viem.deployContract("ConfigManager", [deployer.account.address]);
  console.log("ConfigManager deployed to:", ConfigManager.address);

  // Deploy AdminManager
  console.log("\nDeploying AdminManager...");
  const AdminManager = await hre.viem.deployContract("AdminManager", [deployer.account.address]);
  console.log("AdminManager deployed to:", AdminManager.address);

  // Deploy PublicCrosswordManager
  console.log("\nDeploying PublicCrosswordManager...");
  const PublicCrosswordManager = await hre.viem.deployContract("PublicCrosswordManager", [deployer.account.address]);
  console.log("PublicCrosswordManager deployed to:", PublicCrosswordManager.address);

  // Deploy the main coordinator contract
  console.log("\nDeploying CrosswordBoard coordinator...");
  const CrosswordBoard = await hre.viem.deployContract("CrosswordBoard", [
    CrosswordCore.address,
    CrosswordPrizes.address,
    UserProfiles.address,
    ConfigManager.address,
    AdminManager.address,
    PublicCrosswordManager.address
  ]);
  console.log("CrosswordBoard coordinator deployed to:", CrosswordBoard.address);

  // Get ABIs
  const crosswordCoreArtifact = await hre.artifacts.readArtifact("CrosswordCore");
  const crosswordPrizesArtifact = await hre.artifacts.readArtifact("CrosswordPrizes");
  const userProfilesArtifact = await hre.artifacts.readArtifact("UserProfiles");
  const configManagerArtifact = await hre.artifacts.readArtifact("ConfigManager");
  const adminManagerArtifact = await hre.artifacts.readArtifact("AdminManager");
  const publicCrosswordManagerArtifact = await hre.artifacts.readArtifact("PublicCrosswordManager");
  const crosswordBoardArtifact = await hre.artifacts.readArtifact("CrosswordBoard");

  // Save to frontend
  console.log("\nSaving deployment info to frontend...");
  const deploymentInfo = {
    network: "sepolia",
    contracts: {
      CrosswordCore: {
        address: CrosswordCore.address,
        abi: crosswordCoreArtifact.abi,
      },
      CrosswordPrizes: {
        address: CrosswordPrizes.address,
        abi: crosswordPrizesArtifact.abi,
      },
      UserProfiles: {
        address: UserProfiles.address,
        abi: userProfilesArtifact.abi,
      },
      ConfigManager: {
        address: ConfigManager.address,
        abi: configManagerArtifact.abi,
      },
      AdminManager: {
        address: AdminManager.address,
        abi: adminManagerArtifact.abi,
      },
      PublicCrosswordManager: {
        address: PublicCrosswordManager.address,
        abi: publicCrosswordManagerArtifact.abi,
      },
      CrosswordBoard: {
        address: CrosswordBoard.address,
        abi: crosswordBoardArtifact.abi,
      }
    },
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
  };

  // Create contracts directory if it doesn't exist
  const fs = require("fs");
  const path = require("path");
  const contractsDir = path.join(__dirname, "..", "web", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentInfoPath = path.join(contractsDir, "modularized-sepolia-deployment.json");
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentInfoPath}`);

  // For frontend compatibility, also update the existing sepolia contracts
  const sepoliaContracts = {
    CrosswordBoard: {
      address: CrosswordBoard.address,
      abi: crosswordBoardArtifact.abi
    }
  };

  fs.writeFileSync(
    path.join(contractsDir, "CrosswordBoard.json"),
    JSON.stringify({
      address: CrosswordBoard.address,
      abi: crosswordBoardArtifact.abi
    }, null, 2)
  );

  console.log("✅ Updated CrosswordBoard.json with coordinator contract ABI");

  // Verify contracts (optional)
  try {
    console.log("\nAttempting to verify contracts...");

    // Verify CrosswordCore
    await hre.run("verify:verify", {
      address: CrosswordCore.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify CrosswordPrizes
    await hre.run("verify:verify", {
      address: CrosswordPrizes.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify UserProfiles
    await hre.run("verify:verify", {
      address: UserProfiles.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify ConfigManager
    await hre.run("verify:verify", {
      address: ConfigManager.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify AdminManager
    await hre.run("verify:verify", {
      address: AdminManager.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify PublicCrosswordManager
    await hre.run("verify:verify", {
      address: PublicCrosswordManager.address,
      constructorArguments: [deployer.account.address],
    });

    // Verify CrosswordBoard
    await hre.run("verify:verify", {
      address: CrosswordBoard.address,
      constructorArguments: [
        CrosswordCore.address,
        CrosswordPrizes.address,
        UserProfiles.address,
        ConfigManager.address,
        AdminManager.address,
        PublicCrosswordManager.address
      ],
    });

    console.log("✅ All contracts verified successfully!");
  } catch (error) {
    console.log("⚠️ Contract verification may take a few minutes to complete or requires API key:", error.message);
  }

  console.log("\n✅ Modularized deployment completed!");
  console.log("\nContract addresses:");
  console.log("- CrosswordCore:", CrosswordCore.address);
  console.log("- CrosswordPrizes:", CrosswordPrizes.address);
  console.log("- UserProfiles:", UserProfiles.address);
  console.log("- ConfigManager:", ConfigManager.address);
  console.log("- AdminManager:", AdminManager.address);
  console.log("- PublicCrosswordManager:", PublicCrosswordManager.address);
  console.log("- CrosswordBoard (coordinator):", CrosswordBoard.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });