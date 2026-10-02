import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { DatabaseClient } from "../src/lib/db/database";
import { MIGRATIONS } from "../src/lib/db/migrations";
import { runPostMigrations } from "../src/lib/db/post-migrate";
import { seedDatabase } from "../src/lib/db/seed-data";

class ServerDatabase implements DatabaseClient {
  constructor(private readonly database: Database.Database) {}

  async select<T>(sql: string, bindValues: unknown[] = []): Promise<T> {
    return this.database.prepare(sql).all(...bindValues) as T;
  }

  async execute(sql: string, bindValues: unknown[] = []): Promise<void> {
    this.database.prepare(sql).run(...bindValues);
  }

  close(): void {
    this.database.close();
  }
}

export interface InitializedDatabase {
  client: ServerDatabase;
  path: string;
}

function isDuplicateColumnError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes("duplicate column name");
}

export async function initializeDatabase(dataDirectory: string): Promise<InitializedDatabase> {
  const path = join(dataDirectory, "sigma.db");
  mkdirSync(dirname(path), { recursive: true });

  const rawDatabase = new Database(path);
  rawDatabase.pragma("journal_mode = WAL");
  rawDatabase.pragma("foreign_keys = ON");
  rawDatabase.pragma("busy_timeout = 5000");

  const client = new ServerDatabase(rawDatabase);
  for (const sql of MIGRATIONS) {
    try {
      await client.execute(sql);
    } catch (error) {
      if (!isDuplicateColumnError(error)) {
        throw error;
      }

      console.warn(`Ignoring an existing SQLite column: ${error.message}`);
    }
  }

  await seedDatabase(client);
  await runPostMigrations(client);

  return { client, path };
}
