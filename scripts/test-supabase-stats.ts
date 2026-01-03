
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/web
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTable() {
  console.log("Checking Supabase connection...");
  console.log("URL:", supabaseUrl);
  
  const { data, error } = await supabase
    .from('app_stats')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error("Error connecting to app_stats table:", error.message);
    console.log("Make sure you executed the SQL I provided in the Supabase SQL Editor.");
  } else {
    console.log("Successfully connected to app_stats table!");
    console.log("Current data:", JSON.stringify(data, null, 2));
  }
}

verifyTable();
