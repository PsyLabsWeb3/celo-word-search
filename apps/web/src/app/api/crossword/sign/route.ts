import { NextResponse } from 'next/server';
import { createWalletClient, http, toHex, keccak256, encodePacked, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores, celoSepolia } from 'viem/chains';
import { CONTRACTS } from '../../../../lib/contracts';

// Private key is read dynamically inside the handler for better error handling

export async function POST(req: Request) {
  try {
    console.log("---[/api/crossword/sign] New POST Request ---");
    const privateKey = process.env.SIGNER_PRIVATE_KEY;

    if (!privateKey) {
      console.error('[SIGN ERROR] SIGNER_PRIVATE_KEY is missing or empty');
      return NextResponse.json({ error: 'Server signer not configured' }, { status: 500 });
    }

    let sanitizedKey = privateKey.trim();
    if (!sanitizedKey.startsWith('0x') && sanitizedKey.length === 64) {
      sanitizedKey = `0x${sanitizedKey}`;
    }

    const { user, crosswordId, durationMs, contractAddress } = await req.json();
    console.log("[SIGN DEBUG] Request Body:", { user, crosswordId, durationMs, contractAddress });

    if (!user || !crosswordId || !durationMs || !contractAddress) {
      console.error("[SIGN ERROR] Missing required parameters in request body");
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine the chain and core contract address from the provided proxy address
    let coreContractAddress;
    let chainId;

    for (const id of Object.keys(CONTRACTS)) {
        const chainConfig = (CONTRACTS as any)[id];
        if (chainConfig.CrosswordBoard && getAddress(chainConfig.CrosswordBoard.address) === getAddress(contractAddress)) {
            coreContractAddress = chainConfig.CrosswordCore?.address;
            chainId = id;
            break;
        }
    }

    if (!coreContractAddress) {
        console.error(`[SIGN ERROR] Could not find core contract for the provided board address: ${contractAddress}`);
        return NextResponse.json({ error: 'Could not find core contract for the provided board address' }, { status: 500 });
    }
    console.log(`[SIGN DEBUG] Found Core Contract Address: ${coreContractAddress} for Chain ID: ${chainId}`);


    const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
    console.log(`[SIGN DEBUG] Signer Address from PK: ${account.address}`);
    
    // Hash message: (user, crosswordId, durationMs, coreContractAddress)
    // IMPORTANT: Must match the hashing logic in the Smart Contract
    const messageHash = keccak256(encodePacked(
      ["address", "bytes32", "uint256", "address"],
      [getAddress(user), crosswordId, BigInt(durationMs), getAddress(coreContractAddress)]
    ));
    console.log("[SIGN DEBUG] Hashing values:", {
        user: getAddress(user),
        crosswordId: crosswordId,
        durationMs: BigInt(durationMs).toString(),
        coreContractAddress: getAddress(coreContractAddress)
    });
    console.log(`[SIGN DEBUG] Generated Message Hash: ${messageHash}`);

    // Sign the hash
    const signature = await account.signMessage({ 
      message: { raw: messageHash } 
    });
    console.log(`[SIGN DEBUG] Generated Signature: ${signature}`);

    console.log("---[/api/crossword/sign] Responding with signature ---");
    return NextResponse.json({ signature });
  } catch (error: any) {
    console.error('[SIGN ERROR] Unhandled exception in signing route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
