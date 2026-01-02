"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useGetUserProfile } from "@/hooks/useContract";

interface FarcasterUserDisplayProps {
  address: string;
  fallbackUsername?: string;
  size?: "sm" | "md" | "lg";
  initialUsername?: string;
  initialDisplayName?: string;
  initialPfpUrl?: string;
}

// This component displays a Farcaster user with avatar, username, and address
// It tries to resolve the address to a Farcaster profile from the blockchain, falling back to address display
export default function FarcasterUserDisplay({
  address,
  fallbackUsername = "User",
  size = "md",
  initialUsername,
  initialDisplayName,
  initialPfpUrl
}: FarcasterUserDisplayProps) {
  const [userData, setUserData] = useState<{
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Use the blockchain hook to get user profile
  const { data: blockchainProfile, isLoading: isBlockchainLoading, isError, refetch } = useGetUserProfile(address as `0x${string}`);

  // Check if initial data is provided (from historical records or other sources)
  useEffect(() => {
    if (initialUsername !== undefined && initialDisplayName !== undefined && initialPfpUrl !== undefined) {
      // Use initial data if it's valid
      if (initialUsername && initialUsername.trim() !== "" && initialUsername.trim() !== "0") {
        setUserData({
          username: initialUsername,
          displayName: initialDisplayName || initialUsername,
          pfpUrl: initialPfpUrl || ""
        });
        setLoading(false);
        return; // Early return to skip the rest of the effect
      }
    }
  }, [initialUsername, initialDisplayName, initialPfpUrl]);

  // Initialize on component mount
  useEffect(() => {
    // Debug log removed - Component mounted for address
    // Initial fetch is handled by wagmi automatically
  }, [address]);

  // Log when props change
  useEffect(() => {
    // Debug log removed - Props updated
  }, [address, fallbackUsername, size]);

  useEffect(() => {
    // Function to fetch from API as fallback - this can enhance the data with avatar
    const fetchProfileFromAPI = async () => {
      try {
        const response = await fetch(`/api/farcaster-profiles/${address}`);
        if (response.ok) {
          const profile = await response.json();
          if (profile && profile.username && profile.username.trim() !== "" && profile.username.trim() !== "0") {
            // Update the user data with API data (which may include avatar)
            setUserData(prevData => ({
              username: profile.username || (prevData?.username ?? ""),
              displayName: profile.displayName || profile.username || (prevData?.displayName ?? ""),
              pfpUrl: profile.pfpUrl || (prevData?.pfpUrl ?? "")
            }));
            return true; // Successfully found profile
          }
        }
      } catch (error) {
        console.error(`Error fetching profile from API for ${address}:`, error);
      }
      return false; // No profile found in API
    };

    // Check if we have initial data with a valid username and set it
    let hasInitialData = false;
    if (initialUsername !== undefined && initialDisplayName !== undefined && initialPfpUrl !== undefined) {
      if (initialUsername && initialUsername.trim() !== "" && initialUsername.trim() !== "0") {
        setUserData({
          username: initialUsername,
          displayName: initialDisplayName || initialUsername,
          pfpUrl: initialPfpUrl || ""
        });
        hasInitialData = true;
      }
    }
    // Debug log removed - Profile data received

    if (blockchainProfile) {
      // blockchainProfile should be an array [username, displayName, pfpUrl, timestamp]
      // but let's handle it more thoroughly to ensure we handle different return formats
      let username = "";
      let displayName = "";
      let pfpUrl = "";

      if (Array.isArray(blockchainProfile)) {
        // Standard wagmi return format - contract returns [username, displayName, pfpUrl, timestamp]
        // The array will have 4 elements, we only need the first 3
                username = blockchainProfile[0];
        displayName = blockchainProfile[1];
        pfpUrl = blockchainProfile[2];
      } else if (typeof blockchainProfile === 'object' && blockchainProfile !== null) {
        // Named return format - type assertion to access properties safely
        const profileObj = blockchainProfile as {
          username?: string;
          displayName?: string;
          pfpUrl?: string;
          timestamp?: bigint
        };
        username = profileObj.username || "";
        displayName = profileObj.displayName || "";
        pfpUrl = profileObj.pfpUrl || "";
      }

      // Debug log removed - Parsed profile

      // If we have a valid username from blockchain, use it; otherwise fall back
      if (username && username.trim() !== "" && username.trim() !== "0") { // Check for empty string or "0"
        // Debug log removed - Using Farcaster profile data
        setUserData(prevData => ({
          username: username,
          displayName: displayName || (prevData?.displayName ?? username),
          pfpUrl: pfpUrl || (prevData?.pfpUrl ?? "")
        }));
      } else {
        // Fallback to address display
        // Debug log removed - No Farcaster data found in blockchain, using fallback
        setUserData({
          username: fallbackUsername,
          displayName: fallbackUsername,
          pfpUrl: ""
        });
      }
      setLoading(false);
    } else if (isError && !isBlockchainLoading) {
      // If there was an error fetching from blockchain, try to get from API as fallback
      // Debug log removed - Error occurred fetching profile from blockchain, trying API fallback

      // Fetch profile from API as fallback
      fetchProfileFromAPI().finally(() => {
        setLoading(false);
      });
    } else if (!isBlockchainLoading) {
      // If we have initial data, we can stop loading and just try to enhance in background
      if (hasInitialData) {
        setLoading(false);
        // Try to enhance with API data in background, but don't block the UI
        fetchProfileFromAPI();
      } else {
        // If no initial data, use fallback and try API as fallback
        setUserData({
          username: fallbackUsername,
          displayName: fallbackUsername,
          pfpUrl: ""
        });
        // Fetch profile from API as fallback
        fetchProfileFromAPI().finally(() => {
          setLoading(false);
        });
      }
    } else if (isBlockchainLoading) {
      // If still loading blockchain data and have initial data, temporarily show initial data but keep loading state
      if (hasInitialData) {
        // Don't set loading false yet as we're still trying to get better data from blockchain
      }
    }
  }, [blockchainProfile, isBlockchainLoading, isError, fallbackUsername, address, initialUsername, initialDisplayName, initialPfpUrl]);

  // Add a retry mechanism for when profile data is not immediately available
  useEffect(() => {
    if (isBlockchainLoading && blockchainProfile === undefined) {
      // Data is still loading and no profile yet, this is normal initial state
      // Debug log removed - Initial loading state, waiting for data
    } else if (!isBlockchainLoading && blockchainProfile === undefined && isError) {
      // Data finished loading but is still undefined and there was an error
      // Debug log removed - Profile data fetch resulted in error, using fallback
    } else if (!isBlockchainLoading && blockchainProfile === undefined && !isError) {
      // Data finished loading but is still undefined, this might be an issue
      // Debug log removed - Profile data is undefined after loading completed, might need to try again later
    }
  }, [blockchainProfile, isBlockchainLoading, isError]);

  // Format address for display
  const formatAddress = (addr: string): string => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  };

  if (loading || isBlockchainLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse`}></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-3 mt-1 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className={`${sizeClasses[size]} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]`}>
        {userData?.pfpUrl && userData.pfpUrl !== "" ? (
          <AvatarImage src={userData.pfpUrl} alt={`${userData.displayName || 'User'}'s profile`} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold">
              {userData?.displayName?.charAt(0) || formatAddress(address).charAt(2)}
            </span>
          </div>
        )}
        <AvatarFallback>
          {formatAddress(address).substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col min-w-0 overflow-hidden">
        <span className="font-black text-foreground truncate">
          {userData && userData.username && userData.username !== "" ? userData.username : formatAddress(address)}
        </span>
        <span className="text-xs font-bold text-muted-foreground truncate">
          {formatAddress(address)}
        </span>
      </div>
    </div>
  );
}
