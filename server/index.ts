import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadServerConfig } from "./config";
import { initializeDatabase } from "./database";

const config = loadServerConfig();
const database = await initializeDatabase(config.dataDirectory);
const indexPath = join(config.staticDirectory, "index.html");

const app = new Hono();

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
    database: database.path,
  }),
);

app.get("/*", serveStatic({ root: config.staticDirectory }));

app.notFound((context) => {
  if (!existsSync(indexPath)) {
    return context.text("Sigma frontend is not built.", 503);
  }

  return context.html(readFileSync(indexPath, "utf8"));
});

const server = serve({
  fetch: app.fetch,
  port: config.port,
});

function shutdown(signal: string): void {
  console.info(`Received ${signal}; shutting down Sigma server.`);
  server.close();
  database.client.close();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

console.info(`Sigma server listening on port ${config.port}.`);
