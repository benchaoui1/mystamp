// ═══════════════════════════════════════════════════════════
//  supabase-config.js  —  Supabase client (browser-safe)
//
//  Uses the PUBLIC "anon" key — this is SAFE to expose in the
//  browser. Security is enforced by Row Level Security (RLS)
//  policies you set in Supabase (see SUPABASE_SETUP_GUIDE.md).
//
//  Replace the two values below with your own project's values
//  from: Supabase Dashboard → Project Settings → API
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cqnuqasiwgonellnhvnn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xWbq9r17_dVdy8h_HpVZ3g_fNa8VUte';

// Loaded from CDN in checkout.html (window.supabase)
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

window.mystampSupabase = supabaseClient;
