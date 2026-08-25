import { createApp } from "./app.js";
import { createDatabaseClient } from "./db/client.js";
import { createSectorRepository } from "./repositories/sectors.js";

const port = Number(process.env.PORT ?? 3333);
const { db, pool } = createDatabaseClient();
const app = createApp({ sectors: createSectorRepository(db) });

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(async (error) => {
    await pool.end();

    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
