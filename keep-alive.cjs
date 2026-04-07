const { spawn } = require('child_process');

function start() {
  const child = spawn('node', ['./node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  child.on('exit', (code) => {
    console.log('Restarting in 2s...');
    setTimeout(start, 2000);
  });
}
console.log('Keep-alive starting...');
start();
