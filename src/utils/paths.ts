import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const CHROME_PROFILE_DIR = path.join(DATA_DIR, 'chrome-profile');
export const STAPLES_FILE = path.join(DATA_DIR, 'staples.json');

export function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
