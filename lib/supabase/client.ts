import { getBrowserSupabaseClient } from "@/lib/supabaseBrowser";

export function createClient() {
  return getBrowserSupabaseClient();
}
