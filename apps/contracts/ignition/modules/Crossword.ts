// This setup uses Hardhat Ignition to manage smart contract deployments for the unified Crossword contract.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrosswordModule = buildModule("CrosswordModule", (m) => {
  const deployer = m.getAccount(0);

  // Deploy unified CrosswordBoard contract (includes all functionality)
  const crosswordBoard = m.contract("CrosswordBoard", [deployer]);

  return { crosswordBoard };
});

export default CrosswordModule;