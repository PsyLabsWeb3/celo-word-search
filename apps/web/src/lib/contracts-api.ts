// Function to get the contract ABI
// This loads the ABI from the public directory
export async function getContractABI(contractName: string): Promise<any[]> {
  try {
    // Load the ABI from the public directory based on contract name
    const response = await fetch(`/contracts/${contractName}.json`);
    if (response.ok) {
      const contractData = await response.json();
      return contractData.abi || [];
    }

    console.warn(`Could not load ${contractName} ABI from public directory`);
    return [];
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error);
    return [];
  }
}