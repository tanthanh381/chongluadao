import { createClient } from "@supabase/supabase-js";

// This is a browser-safe Supabase publishable key. Authorization is enforced
// by Postgres Row Level Security; no secret/service-role key is shipped here.
const SUPABASE_URL = "https://goietwyapiywrtibpkwo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ghj-H14bq2n1tSsH4u-adA_LoBtWKO4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
