import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';
import http from 'http';

const PORT = Number(process.env.PORT) || 4000;
const URL = `http://localhost:${PORT}`;

function killPort(port) {
  try {
    if (platform() === 'win32') {
      const out = execSync(
        `netstat -ano | findstr ":${port}" | findstr LISTENING`,
        { encoding: 'utf8' }
      );
      const pids = new Set();
      for (const line of out.split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[dev] Processo ${pid} na porta ${port} encerrado`);
        } catch {}
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
        stdio: 'ignore',
        shell: true,
      });
    }
  } catch {
    // Porta livre
  }
}

function openBrowser(url) {
  const cmd =
    platform() === 'win32'
      ? `start "" "${url}"`
      : platform() === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  execSync(cmd, { stdio: 'ignore' });
}

function waitForServer(maxAttempts = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http
        .get(`${URL}/api/health`, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            if (res.statusCode === 200 && body.includes('"status":"ok"')) resolve();
            else retry();
          });
        })
        .on('error', retry);
    };
    const retry = () => {
      attempts++;
      if (attempts >= maxAttempts) reject(new Error('Servidor não respondeu a tempo'));
      else setTimeout(check, 500);
    };
    check();
  });
}

// Libera a porta antes de subir (evita EADDRINUSE / crash)
console.log(`\n🔧 Liberando porta ${PORT}...\n`);
killPort(PORT);

if (!existsSync('server/node_modules')) {
  console.log('\n📦 Instalando dependências do server...\n');
  execSync('npm install --prefix server', { stdio: 'inherit' });
}
if (!existsSync('client/node_modules')) {
  console.log('\n📦 Instalando dependências do client...\n');
  execSync('npm install --include=dev --prefix client', { stdio: 'inherit' });
}

console.log('\n🔨 Compilando frontend...\n');
execSync('npm run build --prefix client', { stdio: 'inherit' });
console.log('\n🔨 Compilando backend...\n');
execSync('npm run build --prefix server', { stdio: 'inherit' });

console.log('\n🚀 Iniciando sistema...\n');
const server = spawn('node', ['server/dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit',
  shell: false,
  cwd: process.cwd(),
});

let exited = false;
server.on('close', (code) => {
  exited = true;
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  if (!exited) server.kill('SIGINT');
});
process.on('SIGTERM', () => {
  if (!exited) server.kill('SIGTERM');
});

// Aguarda o processo subir (evita falso positivo no health)
await new Promise((r) => setTimeout(r, 1500));
if (exited) process.exit(1);

try {
  await waitForServer();
  console.log(`\n✅ Sistema pronto → ${URL}\n`);
  openBrowser(URL);
} catch (err) {
  console.error('\n❌ Falha ao iniciar:', err.message);
  if (!exited) server.kill();
  process.exit(1);
}
