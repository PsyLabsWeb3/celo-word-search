// Crossword complete deployment module
// Deploys all necessary contracts for the Crossword game
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrosswordCompleteModule = buildModule("CrosswordCompleteModule", (m) => {
  const deployer = m.getAccount(0);

  // Deploy individual contracts
  const crosswordCore = m.contract("CrosswordCore", [deployer]);
  const crosswordPrizes = m.contract("CrosswordPrizes", [deployer]);
  const userProfiles = m.contract("UserProfiles", [deployer]);
  const configManager = m.contract("ConfigManager", [deployer]);
  const adminManager = m.contract("AdminManager", [deployer]);

  // Deploy CrosswordBoard to coordinate all contracts
  const crosswordBoard = m.contract("CrosswordBoard", [
    crosswordCore,
    crosswordPrizes,
    userProfiles,
    configManager,
    adminManager
  ]);

  // Optionally configure max winners
  m.call(crosswordPrizes, "setMaxWinners", [5], {
    id: "setMaxWinners"
  });

  return { 
    crosswordCore, 
    crosswordPrizes, 
    userProfiles, 
    configManager, 
    adminManager, 
    crosswordBoard 
  };
});

export default CrosswordCompleteModule;