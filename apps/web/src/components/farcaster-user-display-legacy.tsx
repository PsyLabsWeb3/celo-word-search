"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useGetUserProfile } from "@/hooks/useContract";

interface FarcasterUserDisplayLegacyProps {
  address: string;
  fallbackUsername?: string;
  size?: "sm" | "md" | "lg";
}

// This component displays a Farcaster user for legacy crosswords with avatar, username, and address
// It tries to resolve the address to a Farcaster profile from the blockchain, falling back to address display
export default function FarcasterUserDisplayLegacy({
  address,
  fallbackUsername = "User",
  size = "md"
}: FarcasterUserDisplayLegacyProps) {
  const [userData, setUserData] = useState<{
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Use the blockchain hook to get user profile
  const { data: blockchainProfile, isLoading: isBlockchainLoading, isError, refetch } = useGetUserProfile(address as `0x${string}`);

  useEffect(() => {
    // Function to fetch from API as fallback
    const fetchProfileFromAPI = async () => {
      try {
        const response = await fetch(`/api/farcaster-profiles/${address}`);
        if (response.ok) {
          const profile = await response.json();
          if (profile && profile.username && profile.username.trim() !== "" && profile.username.trim() !== "0") {
            setUserData({
              username: profile.username,
              displayName: profile.displayName || profile.username,
              pfpUrl: profile.pfpUrl || ""
            });
            return true; // Successfully found profile
          }
        }
      } catch (error) {
        console.error(`Error fetching profile from API for ${address}:`, error);
      }
      return false; // No profile found in API
    };

    // When blockchain profile data is available
    if (blockchainProfile) {
      let username = "";
      let displayName = "";
      let pfpUrl = "";

      if (Array.isArray(blockchainProfile)) {
        // Standard wagmi return format - contract returns [username, displayName, pfpUrl, timestamp]
        [username, displayName, pfpUrl] = blockchainProfile.slice(0, 3);
      } else if (typeof blockchainProfile === 'object' && blockchainProfile !== null) {
        // Named return format
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

      // If we have a valid username from blockchain, use it; otherwise fall back
      if (username && username.trim() !== "" && username.trim() !== "0") {
        setUserData({
          username: username,
          displayName: displayName || username,
          pfpUrl: pfpUrl || ""
        });
        setLoading(false);
      } else {
        // Fallback to API if blockchain doesn't have the data
        fetchProfileFromAPI().finally(() => {
          setLoading(false);
        });
      }
    } else if (isError && !isBlockchainLoading) {
      // If there was an error fetching from blockchain, try the API
      fetchProfileFromAPI().finally(() => {
        setLoading(false);
      });
    } else if (!isBlockchainLoading) {
      // If no blockchain profile found and no error, try the API as fallback
      fetchProfileFromAPI().finally(() => {
        setLoading(false);
      });
    }
  }, [blockchainProfile, isBlockchainLoading, isError, address]);

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
          {userData && userData.username && userData.username !== "" && userData.username !== "0"
            ? userData.username
            : formatAddress(address)}
        </span>
        <span className="text-xs font-bold text-muted-foreground truncate">
          {formatAddress(address)}
        </span>
      </div>
    </div>
  );
}