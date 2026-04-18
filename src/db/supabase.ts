import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../config.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL e SUPABASE_KEY são obrigatórios. Configure no .env");
    }
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}
