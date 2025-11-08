"use client";

import { useState } from "react";
import { sdk } from "@farcaster/frame-sdk";

interface AddMiniappButtonProps {
  className?: string;
}

export default function AddMiniappButton({ className = "" }: AddMiniappButtonProps) {
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);

  const handleAddMiniApp = async () => {
    if (isAddingMiniApp) return;
    
    setIsAddingMiniApp(true);
    setAddMiniAppMessage(null);
    
    try {
      const result = await sdk.actions.addMiniApp();
      // Handle the result according to the actual type returned by the SDK
      // The result might be a boolean or have a different property name
      if (result) { // Simplified check - the exact property depends on SDK version
        setAddMiniAppMessage("✅ Miniapp added successfully!");
      } else {
        setAddMiniAppMessage("ℹ️ Miniapp was not added (user declined or already exists)");
      }
    } catch (error: any) {
      console.error('Add miniapp error:', error);
      if (error?.message?.includes('domain')) {
        setAddMiniAppMessage("⚠️ This miniapp can only be added from its official domain");
      } else {
        setAddMiniAppMessage("❌ Failed to add miniapp. Please try again.");
      }
    } finally {
      setIsAddingMiniApp(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleAddMiniApp}
        disabled={isAddingMiniApp}
        className="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isAddingMiniApp ? (
          <>
            <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
            Adding...
          </>
        ) : (
          <>
            <span>📱</span>
            Add Miniapp
          </>
        )}
      </button>
      
      {/* Add Miniapp Status Message */}
      {addMiniAppMessage && (
        <div className="p-3 mt-3 rounded-lg bg-white/30 backdrop-blur-sm">
          <p className="text-sm text-gray-700">{addMiniAppMessage}</p>
        </div>
      )}
    </div>
  );
}