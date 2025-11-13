"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface FarcasterUserDisplayProps {
  address: string;
  fallbackUsername?: string;
  size?: "sm" | "md" | "lg";
}

// This component displays a Farcaster user with avatar, username, and address
// It tries to resolve the address to a Farcaster profile, falling back to address display
export default function FarcasterUserDisplay({
  address,
  fallbackUsername = "User",
  size = "md"
}: FarcasterUserDisplayProps) {
  const [userData, setUserData] = useState<{
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const resolveFarcasterUser = async () => {
      try {
        setLoading(true);
        
        // Call API to resolve address to Farcaster profile
        const response = await fetch('/api/farcaster-profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ addresses: [address] }),
        });
        
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const user = data[address];
        
        if (user) {
          setUserData({
            username: user.username,
            displayName: user.displayName || user.username,
            pfpUrl: user.pfpUrl || ""
          });
        } else {
          // Fallback to address display
          setUserData({
            username: fallbackUsername,
            displayName: fallbackUsername,
            pfpUrl: ""
          });
        }
      } catch (error) {
        console.error("Error resolving Farcaster user:", error);
        toast({
          title: "Error loading user data",
          description: "Could not load Farcaster profile for this user",
        });
        setUserData({
          username: fallbackUsername,
          displayName: fallbackUsername,
          pfpUrl: ""
        });
      } finally {
        setLoading(false);
      }
    };

    resolveFarcasterUser();
  }, [address, fallbackUsername, toast]);

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

  if (loading) {
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
        {userData?.pfpUrl ? (
          <AvatarImage src={userData.pfpUrl} alt={`${userData.displayName}'s profile`} />
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
      
      <div className="flex flex-col">
        <span className="font-black text-foreground">
          {userData?.username || formatAddress(address)}
        </span>
        <span className="text-xs font-bold text-muted-foreground">
          {formatAddress(address)}
        </span>
      </div>
    </div>
  );
}