import { supabase } from './supabase-client';

// Type definitions for our database tables
interface CrosswordSolve {
  id: string;
  user_wallet: string;
  crossword_id: string;
  solve_time: string;
  solve_duration_seconds: number;
  points_awarded: number;
  is_verified: boolean;
}

interface LeaderboardEntry {
  user_wallet: string;
  solve_time: string;
  solve_duration_seconds: number;
  points_awarded: number;
  position: number;
}

// Function to submit a solved crossword to Supabase
export const submitSolvedCrossword = async (
  walletAddress: string,
  crosswordId: string,
  solveDurationMs: number,
  points: number = 0
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('solved_crosswords')
      .insert([
        {
          user_wallet: walletAddress,
          crossword_id: crosswordId,
          solve_duration_seconds: Math.floor(solveDurationMs / 1000),
          points_awarded: points,
          is_verified: false, // Will be verified by admin later
        }
      ]);

    if (error) {
      console.error('Error submitting solved crossword:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error submitting solved crossword:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Function to get the leaderboard for a specific crossword
export const getLeaderboard = async (
  crosswordId: string,
  limit: number = 100
): Promise<{ data: LeaderboardEntry[] | null; error?: string }> => {
  try {
    let query = supabase
      .from('solved_crosswords')
      .select(`
        user_wallet,
        solve_time,
        solve_duration_seconds,
        points_awarded
      `)
      .eq('crossword_id', crosswordId)
      .order('solve_time', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return { data: null, error: error.message };
    }

    // Add position based on solve time
    const leaderboardWithPositions = data.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    return { data: leaderboardWithPositions };
  } catch (error: any) {
    console.error('Unexpected error fetching leaderboard:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
};

// Function to get user's solve history
export const getUserSolveHistory = async (
  walletAddress: string
): Promise<{ data: CrosswordSolve[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('solved_crosswords')
      .select('*')
      .eq('user_wallet', walletAddress)
      .order('solve_time', { ascending: false });

    if (error) {
      console.error('Error fetching user solve history:', error);
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error: any) {
    console.error('Unexpected error fetching user solve history:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
};

// Function to verify a wallet address through signature
export const verifyWalletAddress = async (
  message: string,
  signature: string,
  walletAddress: string
): Promise<boolean> => {
  // This would typically involve sending the message and signature to a backend function
  // that verifies the signature against the wallet address
  // For now, we'll return true as a placeholder
  // In a real implementation, you'd call a Supabase edge function or similar
  try {
    const { data, error } = await supabase
      .rpc('verify_wallet_signature', {
        message: message,
        signature: signature,
        wallet_address: walletAddress
      });

    return !error && data;
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return false;
  }
};

// Function to check if a wallet has already solved a specific crossword
export const hasWalletSolvedCrossword = async (
  walletAddress: string,
  crosswordId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('solved_crosswords')
      .select('id')
      .eq('user_wallet', walletAddress)
      .eq('crossword_id', crosswordId)
      .single();

    return !error && data !== null;
  } catch (error) {
    console.error('Error checking if wallet solved crossword:', error);
    return false;
  }
};