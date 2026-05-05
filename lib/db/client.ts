import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _queryClient: ReturnType<typeof postgres> | null = null;

function getQueryClient() {
  if (_queryClient) return _queryClient;
  _queryClient = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 1 : 1,
    idle_timeout: 20,
    prepare: false,
  });
  return _queryClient;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    if (!_db) _db = drizzle(getQueryClient(), { schema, casing: "snake_case" });
    return (_db as any)[prop];
  },
});

export function createListenClient() {
  return postgres(env.DATABASE_URL, { max: 1, prepare: false });
}
