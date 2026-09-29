import { createClient } from '@supabase/supabase-js';

// กำหนด URL สำรองรูปแบบ https:// เพื่อไม่ให้ Next.js พังตอนประมวลผลช่วง Build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);