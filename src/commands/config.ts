import pc from 'picocolors';
import { loadConfig, setConfigValue, getConfigValue } from '../store/config-store.js';
import { AmzError } from '../errors/index.js';

export function configSetCommand(key: string, value: string): void {
  try {
    setConfigValue(key, value);
    console.log(pc.green(`\n  Set ${key} = ${value}\n`));
  } catch (err) {
    throw new AmzError(err instanceof Error ? err.message : String(err));
  }
}

export function configGetCommand(key?: string): void {
  if (!key) {
    configListCommand();
    return;
  }
  try {
    const val = getConfigValue(key);
    console.log(`\n  ${pc.cyan(key)} = ${val !== undefined ? val : pc.dim('(not set)')}\n`);
  } catch (err) {
    throw new AmzError(err instanceof Error ? err.message : String(err));
  }
}

export function configListCommand(): void {
  const config = loadConfig();
  const entries = Object.entries(config);
  if (entries.length === 0) {
    console.log(pc.dim('\n  No config values set. Use `amz config set <key> <value>`.\n'));
    console.log(pc.dim('  Valid keys: defaultStore, defaultHeadless, defaultLimit, defaultTimeout\n'));
    return;
  }
  console.log('');
  for (const [k, v] of entries) {
    console.log(`  ${pc.cyan(k)} = ${v}`);
  }
  console.log('');
}
