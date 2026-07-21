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
// TEMPORARY: reverted from the new sb_publishable_... key back to the
// legacy anon JWT key. The new key was returning "No API key found in
// request" (PGRST204) on POST /rest/v1/orders from fresh browser sessions
// (incognito/mobile), while cached old sessions kept working — pointing to
// a compatibility issue with the new key system on this gateway version.
// Revisit switching back once Supabase's new key rollout stabilizes.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnVxYXNpd2dvbmVsbG5odm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTM3MzAsImV4cCI6MjA5ODIyOTczMH0.CIbBu5mywyP3egTX8xQ9gjnm7HEslE2n9PlrECETmcU';

// Loaded from CDN in checkout.html (window.supabase)
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

window.mystampSupabase = supabaseClient;
