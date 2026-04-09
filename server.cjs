const { spawn } = require('child_process');

function start() {
  const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
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
    console.log(`Server exited with code ${code}. Restarting in 2s...`);
    setTimeout(start, 2000);
  });

  child.unref();
  return child;
}

const server = start();
console.log('Server process started. PID:', server.pid);
