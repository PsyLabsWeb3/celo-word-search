import { NextRequest } from 'next/server';
import { farcasterProfileStorage } from '@/lib/farcaster-profile-storage';

export async function POST(req: NextRequest) {
  try {
    const { address, username, displayName, pfpUrl, txHash, timestamp } = await req.json();

    if (!address || !username) {
      return Response.json({ message: 'Address and username are required' }, { status: 400 });
    }

    // Store the Farcaster profile
    farcasterProfileStorage.store({
      address,
      username,
      displayName: displayName || username,
      pfpUrl: pfpUrl || null,
      timestamp: timestamp || Date.now()
    });
    
    return Response.json({ 
      success: true, 
      message: 'Farcaster profile stored successfully',
      address,
      username
    });
  } catch (error) {
    console.error('Error storing Farcaster profile:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}