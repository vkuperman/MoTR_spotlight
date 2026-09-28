/**
 * Vercel build for the Spotlight Prolific app.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = 'PROLIFIC';
const appDir = 'run_motr_in_magpie/spotlight_PROLIFIC';

console.log(`[vercel-build] SPOTLIGHT_APP=${app} → ${appDir}`);

execSync('npm install && npm run build', {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
});

const srcDist = path.join(appDir, 'dist');
const outRoot = path.join('.vercel-build-output', 'dist');

if (!fs.existsSync(srcDist)) {
  console.error(`[vercel-build] Missing dist at ${srcDist}`);
  process.exit(1);
}

fs.rmSync('.vercel-build-output', { recursive: true, force: true });
fs.cpSync(srcDist, outRoot, { recursive: true });
fs.writeFileSync(path.join(outRoot, 'study-app.txt'), `${app}\n`, 'utf8');

console.log(`[vercel-build] Output ready at ${outRoot}`);
