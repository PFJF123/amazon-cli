import { chromium, type BrowserContext, type Page } from 'playwright';
import { CHROME_PROFILE_DIR, ensureDataDir } from '../utils/paths.js';
import { AsyncLock } from './lock.js';

export interface SessionOptions {
  headless?: boolean;
  timeout?: number;
  debug?: boolean;
}

let context: BrowserContext | null = null;
let currentPage: Page | null = null;
const authLock = new AsyncLock();

export async function getContext(opts: SessionOptions = {}): Promise<BrowserContext> {
  if (context) return context;

  ensureDataDir();

  context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, {
    channel: 'chrome',
    headless: opts.headless ?? false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
    timeout: opts.timeout ?? 30000,
  });

  return context;
}

export async function getPage(opts: SessionOptions = {}): Promise<Page> {
  const ctx = await getContext(opts);
  if (currentPage && !currentPage.isClosed()) return currentPage;

  const pages = ctx.pages();
  currentPage = pages.length > 0 ? pages[0] : await ctx.newPage();
  return currentPage;
}

export function getAuthLock(): AsyncLock {
  return authLock;
}

export async function closeSession(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
    currentPage = null;
  }
}
