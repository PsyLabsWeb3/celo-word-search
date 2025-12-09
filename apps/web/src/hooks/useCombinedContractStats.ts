import { useState, useEffect } from 'react';
import { useLegacyContractStats } from './useLegacyContractStats';
import { useNewContractStats } from './useNewContractStats';

interface CombinedContractStats {
  allCompletedEvents: any[];
  allPrizeEvents: any[];
  loading: boolean;
  error: string | null;
}

export const useCombinedContractStats = (legacyContractAddress: string, newContractAddress: string) => {
  const [stats, setStats] = useState<CombinedContractStats>({
    allCompletedEvents: [],
    allPrizeEvents: [],
    loading: true,
    error: null,
  });

  const legacyStats = useLegacyContractStats(legacyContractAddress);
  const newStats = useNewContractStats(newContractAddress);

  useEffect(() => {
    // Combine stats from both contracts when they're both loaded
    if (!legacyStats.loading && !newStats.loading) {
      const allCompletedEvents = [
        ...legacyStats.completedEvents.map(event => ({ ...event, contractAddress: legacyContractAddress })),
        ...newStats.completedEvents.map(event => ({ ...event, contractAddress: newContractAddress }))
      ];
      
      const allPrizeEvents = [
        ...legacyStats.prizeEvents.map(event => ({ ...event, contractAddress: legacyContractAddress })),
        ...newStats.prizeEvents.map(event => ({ ...event, contractAddress: newContractAddress }))
      ];

      // Combine errors if any
      const combinedError = legacyStats.error || newStats.error;

      setStats({
        allCompletedEvents,
        allPrizeEvents,
        loading: false,
        error: combinedError,
      });
    } else {
      // If either is still loading, show loading state
      setStats({
        allCompletedEvents: [],
        allPrizeEvents: [],
        loading: legacyStats.loading || newStats.loading,
        error: null,
      });
    }
  }, [legacyStats, newStats, legacyContractAddress, newContractAddress]);

  return stats;
};