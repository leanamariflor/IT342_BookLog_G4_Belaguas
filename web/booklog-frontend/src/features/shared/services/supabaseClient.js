import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project-ref.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithProvider = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/oauth2/redirect`
    }
  });

  if (error) {
    console.error("OAuth error:", error);
    throw error;
  }

  return data;
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    throw error;
  }

  return session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};
