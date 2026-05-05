import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 5 : 1,
  idle_timeout: 20,
  prepare: false,
});

export const db = drizzle(queryClient, { schema, casing: "snake_case" });

export function createListenClient() {
  return postgres(env.DATABASE_URL, { max: 1, prepare: false });
}
