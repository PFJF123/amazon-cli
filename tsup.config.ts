import { defineConfig } from 'tsup';
import { writeFileSync, readFileSync } from 'node:fs';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    mcp: 'src/mcp.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: true,
  onSuccess: async () => {
    // Add shebang only to cli.js
    const cliPath = 'dist/cli.js';
    const content = readFileSync(cliPath, 'utf-8');
    if (!content.startsWith('#!')) {
      writeFileSync(cliPath, '#!/usr/bin/env node\n' + content);
    }
    // Add shebang to mcp.js too
    const mcpPath = 'dist/mcp.js';
    const mcpContent = readFileSync(mcpPath, 'utf-8');
    if (!mcpContent.startsWith('#!')) {
      writeFileSync(mcpPath, '#!/usr/bin/env node\n' + mcpContent);
    }
  },
});
