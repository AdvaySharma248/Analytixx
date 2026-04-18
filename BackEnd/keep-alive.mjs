import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../FrontEnd");

function start() {
  const child = spawn("node", ["./node_modules/.bin/next", "dev", "-p", "3000"], {
    cwd: frontendDir,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  child.stdout.on("data", (data) => process.stdout.write(data));
  child.stderr.on("data", (data) => process.stderr.write(data));
  child.on("exit", (code) => {
    console.log(`FrontEnd exited with code ${code}, restarting in 2s...`);
    setTimeout(start, 2000);
  });
}

console.log("Keep-alive starting...");
start();
