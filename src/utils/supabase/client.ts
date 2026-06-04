import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-config";

export const createClient = () => createBrowserClient(supabaseUrl, supabasePublishableKey);
