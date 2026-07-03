import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'kpqrrzjnwtkdpkdmambj';
const supabaseKey = 'YOUR_ANON_PUBLIC_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);