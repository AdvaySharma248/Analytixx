const path = require("path");
const { spawn } = require("child_process");

const frontendDir = path.resolve(__dirname, "../FrontEnd");

function start() {
  const child = spawn("node", ["./node_modules/.bin/next", "dev", "-p", "3000"], {
    cwd: frontendDir,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => process.stdout.write(data));
  child.stderr.on("data", (data) => process.stderr.write(data));
  child.on("exit", () => {
    console.log("Restarting in 2s...");
    setTimeout(start, 2000);
  });
}

console.log("Keep-alive starting...");
start();
