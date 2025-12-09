import { NextResponse } from 'next/server';
import { createWalletClient, http, toHex, keccak256, encodePacked, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores, celoSepolia } from 'viem/chains';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;

export async function POST(req: Request) {
  try {
    if (!SIGNER_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Server signer not configured' }, { status: 500 });
    }

    const { user, crosswordId, durationMs, contractAddress } = await req.json();

    if (!user || !crosswordId || !durationMs || !contractAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);
    
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
