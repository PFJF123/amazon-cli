import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, ensureDataDir } from '../utils/paths.js';

export interface AmzConfig {
  defaultStore?: string;
  defaultHeadless?: boolean;
  defaultLimit?: number;
  defaultTimeout?: number;
}

const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const VALID_KEYS: (keyof AmzConfig)[] = ['defaultStore', 'defaultHeadless', 'defaultLimit', 'defaultTimeout'];

export function loadConfig(): AmzConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(config: AmzConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

export function isValidConfigKey(key: string): key is keyof AmzConfig {
  return VALID_KEYS.includes(key as keyof AmzConfig);
}

export function setConfigValue(key: string, value: string): void {
  if (!isValidConfigKey(key)) {
    throw new Error(`Unknown config key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
  }
  const config = loadConfig();
  if (key === 'defaultHeadless') {
    config.defaultHeadless = value === 'true' || value === '1';
  } else if (key === 'defaultLimit' || key === 'defaultTimeout') {
    const n = parseInt(value);
    if (isNaN(n)) throw new Error(`Value for "${key}" must be a number.`);
    config[key] = n;
  } else {
    config[key] = value as AmzConfig[typeof key] extends string ? string : never;
    (config as Record<string, unknown>)[key] = value;
  }
  saveConfig(config);
}

export function getConfigValue(key: string): unknown {
  if (!isValidConfigKey(key)) {
    throw new Error(`Unknown config key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
  }
  const config = loadConfig();
  return config[key];
}
