/**
 * JOBLEX Supabase Client Configuration
 * Uses @supabase/supabase-js with standard process.env
 * Includes graceful local fallback if Supabase project keys are pending in .env
 */

let createClient = null;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  // @supabase/supabase-js not installed in local environment
}

const hasValidUrl = Boolean(
  process.env.SUPABASE_URL && 
  !process.env.SUPABASE_URL.includes('placeholder') &&
  !process.env.SUPABASE_URL.includes('your-project-id')
);

const clientKey = (
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  ''
);

const isConfigured = Boolean(
  hasValidUrl && 
  clientKey && 
  !clientKey.includes('your-supabase') &&
  !clientKey.includes('placeholder')
);

let supabase = null;
if (isConfigured) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, clientKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });
  } catch (err) {
    console.warn('[Supabase] Initialization warning:', err.message);
  }
}

// If unconfigured or failed to initialize, provide a safe fallback proxy so calls don't crash
if (!supabase) {
  const dummyChain = {
    select: () => dummyChain,
    insert: () => dummyChain,
    update: () => dummyChain,
    delete: () => dummyChain,
    eq: () => dummyChain,
    ilike: () => dummyChain,
    order: () => dummyChain,
    limit: () => dummyChain,
    not: () => dummyChain,
    single: async () => ({ data: null, error: new Error('Supabase unconfigured') }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve) => resolve({ data: null, error: new Error('Supabase unconfigured') })
  };

  supabase = {
    from: () => dummyChain,
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase unconfigured') }),
      signUp: async () => ({ data: null, error: new Error('Supabase unconfigured') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase unconfigured') }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      admin: {
        createUser: async () => ({ data: null, error: new Error('Supabase unconfigured') })
      }
    }
  };
}

module.exports = {
  supabase,
  isConfigured
};
