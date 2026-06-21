import { createApp } from "./app.js";
import { config } from "./config.js";
import { createDatabase } from "./db/database.js";
import { runMigrations } from "./db/migrate.js";

const db = createDatabase();
runMigrations(db);

createApp(db).listen(config.port, () => {
  console.log(`Carbon Compass API listening on http://localhost:${config.port}`);
});
