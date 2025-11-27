// This setup uses Hardhat Ignition to manage smart contract deployments for Crossword contracts.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrosswordModule = buildModule("CrosswordModule", (m) => {
  const deployer = m.getAccount(0);

  // Deploy Config contract first
  const config = m.contract("Config", [deployer]);

  // Deploy CrosswordPrizes contract
  const crosswordPrizes = m.contract("CrosswordPrizes", [deployer]);

  // Deploy CrosswordBoard contract with references to both other contracts
  const crosswordBoard = m.contract("CrosswordBoard", [deployer, crosswordPrizes, config]);

  return { config, crosswordPrizes, crosswordBoard };
});

export default CrosswordModule;