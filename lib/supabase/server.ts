import "server-only";
import { createClient } from "@supabase/supabase-js";

function createServerClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type ServerClient = ReturnType<typeof createServerClient>;

let client: ServerClient | null = null;

function getClient() {
  client ??= createServerClient();
  return client;
}

export const supabaseServer = new Proxy({} as ServerClient, {
  get(_, property) {
    const target = getClient();
    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
