import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/** Creates the database client only when a persistence flow requests it. */
export function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before accessing the database");
  }

  const pool = new Pool({ connectionString });
  return { db: drizzle({ client: pool }), pool };
}

export type Database = ReturnType<typeof createDatabaseClient>["db"];
