import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDatabase } from "./database.js";

export function runMigrations(db = createDatabase()): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const workspaceMigrationDir = join(process.cwd(), "server", "migrations");
  const migrationDir = existsSync(workspaceMigrationDir)
    ? workspaceMigrationDir
    : fileURLToPath(new URL("../../migrations", import.meta.url));
  const files = readdirSync(migrationDir).filter((file) => file.endsWith(".sql")).sort();
  const applied = new Set(
    db.prepare("SELECT filename FROM schema_migrations").all().map((row) => (row as { filename: string }).filename)
  );

  const apply = db.transaction((filename: string) => {
    const sql = readFileSync(join(migrationDir, filename), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations(filename) VALUES (?)").run(filename);
  });

  for (const file of files) {
    if (!applied.has(file)) {
      apply(file);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations();
  console.log("Database migrations applied.");
}
