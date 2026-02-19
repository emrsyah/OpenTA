import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Disable prefetch as it's not supported for "Transaction" pool mode
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}
console.log(process.env.DATABASE_URL);
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
