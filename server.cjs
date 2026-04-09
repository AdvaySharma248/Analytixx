const { spawn } = require('child_process');

function start() {
  const child = spawn('bun', ['run', 'dev'], {
    cwd: '/home/z/my-project',
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('exit', (code) => {
    console.log(`\n[${new Date().toISOString()}] Server exited (code ${code}). Restarting in 2s...`);
    setTimeout(start, 2000);
  });

  child.unref();
  console.log(`[${new Date().toISOString()}] Server started. PID: ${child.pid}`);
}

start();
