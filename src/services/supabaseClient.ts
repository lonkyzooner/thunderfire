import { createClient } from '@supabase/supabase-js';
import { getEnv } from './system/envService';

const env = getEnv();
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);