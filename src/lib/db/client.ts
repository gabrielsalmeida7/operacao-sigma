import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS } from "./migrations";
import { seedDatabase } from "./seed-data";
import { runPostMigrations } from "./post-migrate";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const db = await Database.load("sqlite:sigma.db");
  for (const sql of MIGRATIONS) {
    try {
      await db.execute(sql);
    } catch {
      // ALTER TABLE may fail if column already exists — safe to ignore
    }
  }
  await seedDatabase(db);
  await runPostMigrations(db);
  dbInstance = db;
  return db;
}

export async function resetDbConnection(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
