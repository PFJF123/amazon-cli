import fs from 'node:fs';
import { CONFIG_FILE, ensureDataDir } from '../utils/paths.js';
import { type Config, DEFAULT_CONFIG } from '../models/config.js';

export function loadConfig(): Config {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<Config>): void {
  ensureDataDir();
  const current = loadConfig();
  const merged = { ...current, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n');
}
