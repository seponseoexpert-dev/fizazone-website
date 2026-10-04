const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build', '.cache'];

let timeout = null;
let isSyncing = false;

function shouldIgnore(filePath) {
  const rel = path.relative(ROOT_DIR, filePath);
  return IGNORE_DIRS.some(dir => rel === dir || rel.startsWith(dir + path.sep));
}

function syncToGithub() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString().trim();
    if (!status) {
      isSyncing = false;
      return;
    }

    console.log('\n[Auto-Sync] Changes detected! Pushing to GitHub...');
    execSync('git add .', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    const now = new Date().toLocaleString();
    const commitMsg = `Auto-sync: ${now}`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
    
    console.log('[Auto-Sync] Pushing to origin main...');
    execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('[Auto-Sync] Done! GitHub is up to date.\n');
  } catch (err) {
    console.error('[Auto-Sync] Error during sync:', err.message);
  } finally {
    isSyncing = false;
  }
}

console.log('====================================================');
console.log('  Faiza Zone Auto-Sync Watcher is active!           ');
console.log('  Any saved files will automatically push to GitHub.');
console.log('  Press Ctrl+C to stop.                             ');
console.log('====================================================\n');

fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  const fullPath = path.join(ROOT_DIR, filename);
  if (shouldIgnore(fullPath)) return;

  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    syncToGithub();
  }, 3000); // 3 seconds debounce after saving
});
