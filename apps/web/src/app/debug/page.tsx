"use client"

import { useAccount } from "wagmi";
import { useIsAdmin } from "@/hooks/useContract";

export default function DebugPage() {
  const { address, isConnected, chain } = useAccount();
  const {
    data: isAdmin,
    isLoading,
  } = useIsAdmin();

  if (!isConnected) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Admin Debug Page</h1>
        <p>Please connect your wallet.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Admin Debug Page</h1>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Debug Page</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Wallet Info</h2>
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Chain:</strong> {chain?.name} (ID: {chain?.id})</p>
      </div>

      <div className="mb-6 p-4 border rounded bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Admin Status</h2>
        <p><strong>Is Admin:</strong> {isAdmin ? 'YES' : 'NO'}</p>
      </div>

      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2">Information</h2>
        <p>This page checks if the current wallet has admin privileges via the AdminManager contract.</p>
      </div>
    </div>
  );
}