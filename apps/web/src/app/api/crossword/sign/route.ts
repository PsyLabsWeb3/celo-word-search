import { NextResponse } from 'next/server';
import { createWalletClient, http, toHex, keccak256, encodePacked, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores, celoSepolia } from 'viem/chains';

// Private key is read dynamically inside the handler for better error handling

export async function POST(req: Request) {
  try {
    const privateKey = process.env.SIGNER_PRIVATE_KEY;

    if (!privateKey) {
      console.error('SIGNER_PRIVATE_KEY is missing or empty');
      return NextResponse.json({ error: 'Server signer not configured' }, { status: 500 });
    }

    // Sanitize key
    let sanitizedKey = privateKey.trim();
    
    // Auto-fix missing 0x prefix
    if (!sanitizedKey.startsWith('0x') && sanitizedKey.length === 64) {
      sanitizedKey = `0x${sanitizedKey}`;
      console.log('[Sign Route] Auto-fixed private key prefix');
    }

    const isHex = sanitizedKey.startsWith('0x');
    
    console.log(`[Sign Route] Private Key Check: Length=${sanitizedKey.length}, StartsWith0x=${isHex}`);

    if (!isHex || sanitizedKey.length !== 66) { // 0x + 64 hex chars
       console.error('[Sign Route] Invalid Private Key format. Expected 0x prefix and 66 chars total.');
    }

    const { user, crosswordId, durationMs, contractAddress } = await req.json();

    if (!user || !crosswordId || !durationMs || !contractAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
    
    // Hash message: (user, crosswordId, durationMs, contractAddress)
    // IMPORTANT: Must match the hashing logic in the Smart Contract
    const messageHash = keccak256(encodePacked(
      ["address", "bytes32", "uint256", "address"],
      [getAddress(user), crosswordId, BigInt(durationMs), getAddress(contractAddress)]
    ));

    // Sign the hash
    // We sign the RAW hash because the contract uses ECDSA.recover(toEthSignedMessageHash(messageHash), signature)
    // viem's signMessage automatically applies \x19Ethereum Signed Message:\n32 prefix
    const signature = await account.signMessage({ 
      message: { raw: messageHash } 
    });

    return NextResponse.json({ signature });
  } catch (error: any) {
    console.error('Signing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
