import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { ensureStorageDirectories } from "./services/storage-service.js";

async function start() {
  await ensureStorageDirectories();

  const app = createApp();
  app.listen(env.PORT, env.host, () => {
    console.log(`BackEnd listening on http://${env.host}:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});

