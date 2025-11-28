import { NextRequest } from 'next/server';
import { getContractABI } from '@/lib/contracts-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractName = searchParams.get('contract') || 'CrosswordBoard'; // Default to CrosswordBoard

    // Get the ABI from the contracts build
    const abi = await getContractABI(contractName);

    if (abi && abi.length > 0) {
      return new Response(JSON.stringify(abi), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Contract ABI not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error serving contract ABI:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}