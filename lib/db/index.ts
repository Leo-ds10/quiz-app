import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "quiz.db");

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle({ client: sqlite, schema });
