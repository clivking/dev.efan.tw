import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const buildHome = path.join(projectRoot, '.build-home');
const appDataRoaming = path.join(buildHome, 'AppData', 'Roaming');
const appDataLocal = path.join(buildHome, 'AppData', 'Local');

await mkdir(appDataRoaming, { recursive: true });
await mkdir(appDataLocal, { recursive: true });

const child = spawn(
  process.execPath,
  ['./node_modules/next/dist/bin/next', 'build', '--webpack'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      HOME: buildHome,
      USERPROFILE: buildHome,
      APPDATA: appDataRoaming,
      LOCALAPPDATA: appDataLocal,
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
