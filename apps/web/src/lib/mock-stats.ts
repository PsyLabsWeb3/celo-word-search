// Mock data for immediate display
export const mockStats = {
  totalCompletions: 12450,
  totalPrizeDistributions: 3240,
  totalCrosswordsCreated: 15,
  totalCeloDistributed: 1245.67,
  crossword1Completions: 4520,
  crossword2Completions: 7890,
  testCompletions: 40,
  uniqueUsers: 3240,
  recentTransactions: [
    {
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      type: "Completion",
      user: "0x742d35Cc6634C0532925a3b844Bc454e443867b",
      timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
      contractAddress: "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
    },
    {
      hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      type: "Prize",
      user: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
      amount: "10.50",
      contractAddress: "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
    },
    {
      hash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
      type: "Completion",
      user: "0x473284145f60e59fc8652a941d150ed636a6c1b7",
      timestamp: Date.now() - 1000 * 60 * 25, // 25 minutes ago
      contractAddress: "0xnewcontractaddress"
    },
    {
      hash: "0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      type: "Prize",
      user: "0x5a6b8a1234567890abcdef1234567890abcdef12345",
      timestamp: Date.now() - 1000 * 60 * 35, // 35 minutes ago
      amount: "25.00",
      contractAddress: "0xnewcontractaddress"
    },
    {
      hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
      type: "Completion",
      user: "0x9f8e7d6c5b4a3c2b1a0f9e8d7c6b5a4f3c2b1a0f",
      timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
      contractAddress: "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
    },
    {
      hash: "0xabcdef7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      type: "Created",
      user: "Admin",
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      contractAddress: "0xnewcontractaddress"
    },
    {
      hash: "0x123456abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
      type: "Prize",
      user: "0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      timestamp: Date.now() - 1000 * 60 * 75, // 1 hour 15 min ago
      amount: "5.25",
      contractAddress: "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
    },
    {
      hash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      type: "Completion",
      user: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
      contractAddress: "0xnewcontractaddress"
    },
    {
      hash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
      type: "Prize",
      user: "0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
      timestamp: Date.now() - 1000 * 60 * 105, // 1 hour 45 min ago
      amount: "15.75",
      contractAddress: "0xnewcontractaddress"
    },
    {
      hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedc",
      type: "Completion",
      user: "0x5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
      timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
      contractAddress: "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
    }
  ],
  isLoading: true,
  error: null
};