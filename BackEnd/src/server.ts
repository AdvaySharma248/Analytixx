import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./lib/db.js";
import { ensureStorageDirectories } from "./services/storage-service.js";

let shutdownPromise: Promise<void> | null = null;

async function disconnectDatabase() {
  await db.$disconnect().catch(() => undefined);
}

async function shutdown(signal: string) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    console.log(`${signal} received. Shutting down backend...`);
    await disconnectDatabase();
  })();

  return shutdownPromise;
}

async function start() {
  await ensureStorageDirectories();

  const app = createApp();
  const server = app.listen(env.PORT, env.host, () => {
    console.log(`BackEnd listening on http://${env.host}:${env.PORT}`);
  });

  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.keepAliveTimeout = 5_000;

  const registerSignalHandler = (signal: NodeJS.Signals) => {
    process.once(signal, () => {
      const forceCloseTimer = setTimeout(() => {
        console.error("Backend shutdown timed out. Forcing exit.");
        process.exit(1);
      }, 10_000);

      forceCloseTimer.unref();

      server.close(async (error) => {
        clearTimeout(forceCloseTimer);

        if (error) {
          console.error("Failed to close HTTP server cleanly:", error);
          await disconnectDatabase();
          process.exit(1);
          return;
        }

        await shutdown(signal);
        process.exit(0);
      });
    });
  };

  registerSignalHandler("SIGINT");
  registerSignalHandler("SIGTERM");
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  void disconnectDatabase();
  process.exit(1);
});

