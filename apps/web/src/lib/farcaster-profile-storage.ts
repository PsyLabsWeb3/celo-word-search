// Simple in-memory storage for demo purposes
// In production, use a proper database like PostgreSQL, Supabase, etc.

interface FarcasterProfile {
  address: string;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  timestamp: number;
}

// In-memory storage (would be a database in production)
let profileStorage: Record<string, FarcasterProfile> = {};

export const farcasterProfileStorage = {
  // Store a Farcaster profile
  store: (profile: FarcasterProfile): void => {
    profileStorage[profile.address.toLowerCase()] = profile;
  },

  // Get a Farcaster profile by address
  getByAddress: (address: string): FarcasterProfile | undefined => {
    return profileStorage[address.toLowerCase()];
  },

  // Get multiple profiles by addresses
  getByAddresses: (addresses: string[]): Record<string, FarcasterProfile> => {
    const results: Record<string, FarcasterProfile> = {};
    
    for (const addr of addresses) {
      const profile = profileStorage[addr.toLowerCase()];
      if (profile) {
        results[addr] = profile;
      }
    }
    
    return results;
  },

  // Clear all stored profiles (useful for testing)
  clearAll: (): void => {
    profileStorage = {};
  },
};