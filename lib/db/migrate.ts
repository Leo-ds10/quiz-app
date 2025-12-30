import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🚀 Starting database migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Recommended settings for migrations
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10000,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: "./drizzle/pg" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
