import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

export const DATA_DIR = path.join(os.homedir(), '.amazon-cli');
export const CHROME_PROFILE_DIR = path.join(DATA_DIR, 'chrome-profile');
export const STAPLES_FILE = path.join(DATA_DIR, 'staples.json');

export function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  migrateOldData();
}

let migrationAttempted = false;

function migrateOldData(): void {
  if (migrationAttempted) return;
  migrationAttempted = true;

  const oldDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(oldDir) || !fs.statSync(oldDir).isDirectory()) return;

  // Migrate chrome-profile
  const oldProfile = path.join(oldDir, 'chrome-profile');
  if (fs.existsSync(oldProfile) && !fs.existsSync(CHROME_PROFILE_DIR)) {
    fs.cpSync(oldProfile, CHROME_PROFILE_DIR, { recursive: true });
  }

  // Migrate staples.json
  const oldStaples = path.join(oldDir, 'staples.json');
  if (fs.existsSync(oldStaples) && !fs.existsSync(STAPLES_FILE)) {
    fs.copyFileSync(oldStaples, STAPLES_FILE);
  }

  // Migrate config.json
  const oldConfig = path.join(oldDir, 'config.json');
  const newConfig = path.join(DATA_DIR, 'config.json');
  if (fs.existsSync(oldConfig) && !fs.existsSync(newConfig)) {
    fs.copyFileSync(oldConfig, newConfig);
  }
}
