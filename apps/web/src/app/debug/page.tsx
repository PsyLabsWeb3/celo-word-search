"use client"

import { useAccount } from "wagmi";
import { useAdminStatus } from "@/hooks/useContract";

export default function DebugPage() {
  const { address, isConnected, chain } = useAccount();
  const {
    isBoardAdmin,
    isPrizesAdmin,
    isDefaultAdmin,
    isLegacyAdmin,
    isLoading,
    allResults
  } = useAdminStatus();

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

      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Contract Results</h2>
        <p><strong>Board Admin (hasRole ADMIN_ROLE):</strong> {allResults.prizesAdmin ? 'true' : 'false'}</p>
        <p><strong>Default Admin (hasRole DEFAULT_ADMIN_ROLE):</strong> {allResults.defaultAdmin ? 'true' : 'false'}</p>
        <p><strong>Legacy Admin (isAdminAddress):</strong> {allResults.legacyAdmin ? 'true' : 'false'}</p>
      </div>

      <div className="mb-6 p-4 border rounded bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Admin Status</h2>
        <p><strong>Is Prizes Admin:</strong> {isPrizesAdmin ? 'YES' : 'NO'}</p>
        <p><strong>Is Default Admin:</strong> {isDefaultAdmin ? 'YES' : 'NO'}</p>
        <p><strong>Is Legacy Admin:</strong> {isLegacyAdmin ? 'YES' : 'NO'}</p>
        <p><strong>Overall Admin:</strong> {(isPrizesAdmin || isDefaultAdmin || isLegacyAdmin) ? 'YES' : 'NO'}</p>
      </div>

      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2">Information</h2>
        <p>This page shows the detailed admin status verification.</p>
        <p>For a user to be an admin, any of the following needs to be true:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>hasRole(ADMIN_ROLE) returns true on CrosswordBoard contract (prizes/admin functions)</li>
          <li>hasRole(DEFAULT_ADMIN_ROLE) returns true on CrosswordBoard contract (highest level admin)</li>
          <li>isAdminAddress() returns true on CrosswordBoard contract (legacy admin check)</li>
        </ul>
      </div>
    </div>
  );
}