import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance of Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };