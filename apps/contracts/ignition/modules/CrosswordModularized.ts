// Modularized Crossword deployment module
// Deploys all necessary contracts for the modularized Crossword game
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrosswordModularizedModule = buildModule("CrosswordModularizedModule", (m) => {
  const deployer = m.getAccount(0);

  // Deploy individual contracts
  const crosswordCore = m.contract("CrosswordCore", [deployer]);
  const crosswordPrizes = m.contract("CrosswordPrizes", [deployer]);
  const userProfiles = m.contract("UserProfiles", [deployer]);
  const configManager = m.contract("ConfigManager", [deployer]);
  const adminManager = m.contract("AdminManager", [deployer]);
  const publicCrosswordManager = m.contract("PublicCrosswordManager", [deployer]);

  // Deploy CrosswordBoard to coordinate all contracts
  const crosswordBoard = m.contract("CrosswordBoard", [
    crosswordCore,
    crosswordPrizes,
    userProfiles,
    configManager,
    adminManager,
    publicCrosswordManager
  ]);

  // Optionally configure max winners
  m.call(crosswordPrizes, "setMaxWinners", [10], {
    id: "setMaxWinners"
  });

  // Set signer for CrosswordCore
  m.call(crosswordCore, "setSigner", [deployer], {
    id: "setSigner"
  });

  // Grant OPERATOR role to CrosswordBoard on CrosswordPrizes
  const operatorRole = m.readEventArgument(crosswordPrizes, "OperatorRoleSet", "role");
  m.call(crosswordPrizes, "grantRole", [operatorRole, crosswordBoard], {
    id: "grantOperatorRole"
  });

  // Allow native CELO in CrosswordPrizes
  m.call(crosswordPrizes, "setAllowedToken", ["0x0000000000000000000000000000000000000000", true], {
    id: "allowNativeCELO"
  });

  return {
    crosswordCore,
    crosswordPrizes,
    userProfiles,
    configManager,
    adminManager,
    publicCrosswordManager,
    crosswordBoard
  };
});

export default CrosswordModularizedModule;