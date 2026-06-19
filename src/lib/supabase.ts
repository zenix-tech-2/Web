import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://whglmhqnestemuhvtpsm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZ2xtaHFuZXN0ZW11aHZ0cHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODEzNjgsImV4cCI6MjA5NzQ1NzM2OH0.3dV2VspSSmxo9j4jIrcEXZIW6YjhBKTqOVTORP_LmGQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// getServiceClient() was intentionally removed.
// A Supabase *service role* key bypasses every Row Level Security policy in
// your database. Reading it via import.meta.env.VITE_SUPABASE_SERVICE_KEY
// would put it directly in the browser bundle — anyone visiting the site
// could pull it out of devtools and get full admin access to every table.
//
// If you need elevated/admin database access (e.g. for an admin-only action),
// do it from a server-side route instead, the same way /api/payment/initiate.ts
// uses ASHTECHPAY_SECRET_KEY: read the service key from process.env on the
// server only, never from import.meta.env, and never prefix it with VITE_.
