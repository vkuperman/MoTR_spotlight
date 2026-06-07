/**
 * Vercel build router for two Spotlight apps from one repo.
 * Set SPOTLIGHT_APP=SONA or SPOTLIGHT_APP=PROLIFIC on each Vercel project.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_DIRS = {
  SONA: 'run_motr_in_magpie/spotlight_SONA',
  PROLIFIC: 'run_motr_in_magpie/spotlight_PROLIFIC',
};

const app = String(process.env.SPOTLIGHT_APP || 'SONA').toUpperCase();
const appDir = APP_DIRS[app];

if (!appDir) {
  console.error(`Unknown SPOTLIGHT_APP="${process.env.SPOTLIGHT_APP}". Use SONA or PROLIFIC.`);
  process.exit(1);
}

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
