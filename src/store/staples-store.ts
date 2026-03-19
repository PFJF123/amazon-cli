import fs from 'node:fs';
import { STAPLES_FILE, ensureDataDir } from '../utils/paths.js';
import type { Staple } from '../models/product.js';

export const DEFAULT_STAPLES: Staple[] = [
  {
    asin: 'B078SJ1FB4',
    title: 'Cusqueña Premium Lager Beer, 330ml Bottle (Pack of 24)',
    quantity: 1,
    category: 'Beverages',
    addedAt: new Date().toISOString(),
  },
];

function loadStaples(): Staple[] {
  try {
    const raw = fs.readFileSync(STAPLES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStaples(staples: Staple[]): void {
  ensureDataDir();
  fs.writeFileSync(STAPLES_FILE, JSON.stringify(staples, null, 2) + '\n');
}

export function listStaples(category?: string): Staple[] {
  const all = loadStaples();
  if (!category) return all;
  return all.filter((s) => s.category.toLowerCase() === category.toLowerCase());
}

export function addStaple(staple: Staple): void {
  const all = loadStaples();
  const existing = all.findIndex((s) => s.asin === staple.asin);
  if (existing >= 0) {
    all[existing] = staple;
  } else {
    all.push(staple);
  }
  saveStaples(all);
}

export function removeStaple(nameOrAsin: string): boolean {
  const all = loadStaples();
  const idx = all.findIndex(
    (s) =>
      s.asin === nameOrAsin ||
      s.title.toLowerCase().includes(nameOrAsin.toLowerCase()),
  );
  if (idx < 0) return false;
  all.splice(idx, 1);
  saveStaples(all);
  return true;
}

export function getCategories(): string[] {
  const all = loadStaples();
  return [...new Set(all.map((s) => s.category))];
}

export function seedStaples(): { added: number; skipped: number } {
  const all = loadStaples();
  let added = 0;
  let skipped = 0;

  for (const staple of DEFAULT_STAPLES) {
    if (all.some((s) => s.asin === staple.asin)) {
      skipped++;
    } else {
      all.push({ ...staple, addedAt: new Date().toISOString() });
      added++;
    }
  }

  if (added > 0) saveStaples(all);
  return { added, skipped };
}
