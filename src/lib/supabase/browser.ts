import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config";
import type { Database } from "@/types/database";

export type AccessTokenProvider = () => Promise<string | null>;

export function createBrowserSupabaseClient(accessToken: AccessTokenProvider) {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient<Database>(url, publishableKey, { accessToken });
}
