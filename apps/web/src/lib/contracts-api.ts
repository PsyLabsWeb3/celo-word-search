// Function to get the contract ABI
// This loads the ABI from the public directory
export async function getContractABI(contractName: string): Promise<any[]> {
  try {
    // For CrosswordBoard, load the ABI from the public directory
    if (contractName === 'CrosswordBoard') {
      const response = await fetch('/contracts/CrosswordBoard.json');
      if (response.ok) {
        const contractData = await response.json();
        return contractData.abi || [];
      }

      console.warn(`Could not load ${contractName} ABI from public directory`);
      return [];
    }

    console.warn(`Unknown contract: ${contractName}`);
    return [];
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error);
    return [];
  }
}