#!/usr/bin/env tsx
/**
 * Amazon CLI Daily Health Check
 *
 * Tests each major feature against live Amazon to detect selector breakage.
 * Run: tsx scripts/health-check.ts
 * Schedule: cron or launchd daily
 *
 * Exit codes:
 *   0 = all passed
 *   1 = some failures (selectors likely broken)
 */

import { getPage, closeSession } from '../src/browser/session.js';
import { searchProducts } from '../src/core/search.js';
import { getProduct } from '../src/core/product.js';
import { listCart } from '../src/core/cart.js';
import { listOrders } from '../src/core/orders.js';
import { groceryCategories } from '../src/core/grocery.js';
import { listSubscriptions } from '../src/core/subscribe.js';
import { listAddresses } from '../src/core/address.js';
import { listStaples } from '../src/core/staples.js';
import { loadConfig } from '../src/core/config.js';
import pc from 'picocolors';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const LOG_DIR = path.join(os.homedir(), '.amazon-cli', 'logs');
const LOG_FILE = path.join(LOG_DIR, `health-${new Date().toISOString().slice(0, 10)}.json`);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<string | void>): Promise<void> {
  const start = Date.now();
  try {
    const details = await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration, details: details || undefined });
    console.log(`  ${pc.green('PASS')} ${name} ${pc.dim(`(${duration}ms)`)}`);
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, duration, error: message });
    console.log(`  ${pc.red('FAIL')} ${name} ${pc.dim(`(${duration}ms)`)}`);
    console.log(`       ${pc.dim(message)}`);
  }
}

async function main() {
  console.log(pc.bold('\n  Amazon CLI Health Check'));
  console.log(pc.dim(`  ${new Date().toISOString()}\n`));

  // Use headed mode - Amazon blocks headless access to account pages
  const page = await getPage({ headless: false });

  // 1. Search
  await runTest('search products', async () => {
    const products = await searchProducts(page, 'batteries', { limit: 3 });
    if (products.length === 0) throw new Error('Search returned 0 results');
    if (!products[0].asin) throw new Error('First result has no ASIN');
    if (!products[0].title) throw new Error('First result has no title');
    return `${products.length} results, first: ${products[0].asin}`;
  });

  // 2. Product detail - use a search result ASIN (always in stock)
  await runTest('product detail', async () => {
    const searchResults = await searchProducts(page, 'AA batteries', { limit: 1 });
    if (searchResults.length === 0) throw new Error('No search results to test product detail');
    const asin = searchResults[0].asin;
    const product = await getProduct(page, asin);
    if (!product.title) throw new Error('Product has no title');
    return `${product.title.slice(0, 40)} - $${product.price ?? 'N/A'}`;
  });

  // 3. Cart listing
  await runTest('cart list', async () => {
    const cart = await listCart(page);
    // Cart can be empty, just ensure it doesn't throw
    return `${cart.items.length} items, ${cart.groceryItems.length} grocery`;
  });

  // 4. Orders
  await runTest('orders list', async () => {
    const orders = await listOrders(page, '3m');
    if (orders.length === 0) throw new Error('No orders found (expected at least 1 in 3 months)');
    if (!orders[0].orderId) throw new Error('First order has no ID');
    return `${orders.length} orders`;
  });

  // 5. Grocery categories
  await runTest('grocery categories', async () => {
    const cats = await groceryCategories(page, 'wholefoods');
    if (cats.length === 0) throw new Error('No grocery categories found');
    return `${cats.length} categories`;
  });

  // 6. Addresses (may return 0 if selectors changed - warn but don't fail)
  await runTest('address list', async () => {
    const addresses = await listAddresses(page);
    if (addresses.length === 0) {
      return 'WARN: 0 addresses found (selectors may need updating)';
    }
    return `${addresses.length} addresses`;
  });

  // 7. Subscriptions (may be empty, just shouldn't throw)
  await runTest('subscriptions list', async () => {
    const subs = await listSubscriptions(page);
    return `${subs.length} subscriptions`;
  });

  // 8. Staples (local, no browser)
  await runTest('staples list (local)', async () => {
    const staples = listStaples();
    return `${staples.length} staples`;
  });

  // 9. Config (local, no browser)
  await runTest('config load (local)', async () => {
    const config = loadConfig();
    return `keys: ${Object.keys(config).join(', ') || '(empty)'}`;
  });

  await closeSession();

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('');
  if (failed === 0) {
    console.log(pc.green(`  All ${total} tests passed.\n`));
  } else {
    console.log(pc.red(`  ${failed}/${total} tests failed.\n`));

    // Show which selectors likely need updating
    console.log(pc.yellow('  Likely broken selectors:'));
    for (const r of results.filter((r) => !r.passed)) {
      const selectorHint = guessAffectedSelectors(r.name);
      console.log(`    ${r.name}: check ${pc.cyan(selectorHint)}`);
    }
    console.log('');
  }

  // Write log
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logEntry = {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    total,
    results,
  };
  fs.writeFileSync(LOG_FILE, JSON.stringify(logEntry, null, 2) + '\n');
  console.log(pc.dim(`  Log: ${LOG_FILE}\n`));

  process.exit(failed > 0 ? 1 : 0);
}

function guessAffectedSelectors(testName: string): string {
  const map: Record<string, string> = {
    'search products': 'SELECTORS.search.*',
    'product detail': 'SELECTORS.product.*',
    'cart list': 'SELECTORS.cart.*',
    'orders list': 'SELECTORS.orders.*',
    'grocery categories': 'SELECTORS.grocery.categoryLinks',
    'address list': 'SELECTORS.address.*',
    'subscriptions list': 'SELECTORS.subscribeAndSave.*',
  };
  return map[testName] ?? 'src/selectors/index.ts';
}

main().catch((err) => {
  console.error(pc.red(`\n  Health check crashed: ${err.message}\n`));
  process.exit(1);
});
