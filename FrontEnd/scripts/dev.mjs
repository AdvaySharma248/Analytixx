import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const backendDir = path.resolve(frontendDir, "..", "BackEnd");
const nextBin = path.join(
  frontendDir,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const backendHost = "127.0.0.1";
const backendPort = 4000;
const backendOrigin = `http://${backendHost}:${backendPort}`;

let shuttingDown = false;
let ownsBackend = false;
let backendProcess = null;
let frontendProcess = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(host, port, childProcess, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await canConnect(host, port)) {
      return true;
    }

    if (childProcess?.exitCode != null) {
      return false;
    }

    await delay(250);
  }

  return false;
}

function stopProcess(childProcess) {
  if (!childProcess || childProcess.exitCode != null) {
    return;
  }

  childProcess.kill("SIGTERM");
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopProcess(frontendProcess);

  if (ownsBackend) {
    stopProcess(backendProcess);
  }

  setTimeout(() => process.exit(exitCode), 250);
}

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(0));
});

async function startBackendIfNeeded() {
  if (await canConnect(backendHost, backendPort)) {
    console.log(`[dev] Reusing existing backend on ${backendOrigin}`);
    return;
  }

  console.log(`[dev] Starting backend on ${backendOrigin}`);
  ownsBackend = true;
  backendProcess = spawn(
    process.execPath,
    ["--env-file=.env", "src/server.ts"],
    {
      cwd: backendDir,
      stdio: "inherit",
      env: {
        ...process.env,
        BIND_HOST: backendHost,
        PORT: String(backendPort),
      },
    },
  );

  backendProcess.on("exit", (code) => {
    if (!shuttingDown && frontendProcess) {
      console.error(`[dev] Backend exited early with code ${code ?? 1}.`);
      shutdown(code ?? 1);
    }
  });

  const ready = await waitForPort(
    backendHost,
    backendPort,
    backendProcess,
  );

  if (!ready) {
    throw new Error(`Backend failed to start on ${backendOrigin}`);
  }
}

async function main() {
  await startBackendIfNeeded();

  console.log("[dev] Starting frontend on http://127.0.0.1:3000");
  const exitCode = await new Promise((resolve) => {
    frontendProcess = spawn(
      process.execPath,
      [nextBin, "dev", "-p", "3000"],
      {
        cwd: frontendDir,
        stdio: "inherit",
        env: {
          ...process.env,
          BACKEND_ORIGIN: backendOrigin,
        },
      },
    );

    frontendProcess.on("exit", (code) => {
      resolve(code ?? 0);
    });
  });

  shutdown(exitCode);
}

main().catch((error) => {
  console.error("[dev] Failed to start development servers.", error);
  shutdown(1);
});
