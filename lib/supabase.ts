import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ ไม่พบ SUPABASE_URL หรือ SUPABASE_ANON_KEY ใน .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);