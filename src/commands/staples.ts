import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { ProductPage } from '../pages/product.page.js';
import { listStaples, addStaple, removeStaple } from '../store/staples-store.js';
import { formatStaples } from '../ui/formatters.js';
import { inputStaple, selectStaples, confirmAction } from '../ui/prompts.js';
import type { Staple } from '../models/product.js';

export function staplesListCommand(category?: string): void {
  const staples = listStaples(category);
  console.log(formatStaples(staples));
}

interface StaplesAddOpts {
  asin?: string;
  qty?: string;
  category?: string;
}

export async function staplesAddCommand(opts: StaplesAddOpts & SessionOptions): Promise<void> {
  let asin: string;
  let quantity: number;
  let category: string;

  if (opts.asin) {
    asin = opts.asin;
    quantity = opts.qty ? parseInt(opts.qty) : 1;
    category = opts.category ?? 'General';
  } else {
    const input = await inputStaple();
    asin = input.asin;
    quantity = input.quantity;
    category = input.category;
  }

  // Fetch product title from Amazon
  let title = asin;
  try {
    await withSession(opts, async (page) => {
      const productPage = new ProductPage(page);
      const product = await productPage.getProduct(asin);
      title = product.title;
    });
  } catch {
    console.log(pc.dim('  Could not fetch product title, using ASIN as name.'));
  }

  const staple: Staple = {
    asin,
    title,
    quantity,
    category,
    addedAt: new Date().toISOString(),
  };

  addStaple(staple);
  console.log(pc.green(`\n  Added staple: ${title.slice(0, 50)} (${category}, x${quantity})\n`));
}

export function staplesRemoveCommand(nameOrAsin: string): void {
  const removed = removeStaple(nameOrAsin);
  if (removed) {
    console.log(pc.green(`\n  Removed staple: ${nameOrAsin}\n`));
  } else {
    console.log(pc.yellow(`\n  Staple "${nameOrAsin}" not found.\n`));
  }
}

export async function staplesOrderCommand(category: string | undefined, opts: SessionOptions): Promise<void> {
  const staples = listStaples(category);
  if (staples.length === 0) {
    console.log(pc.dim('\n  No staples to order.\n'));
    return;
  }

  const selected = await selectStaples(staples);
  if (selected.length === 0) return;

  await withSession(opts, async (page) => {
    const productPage = new ProductPage(page);
    let succeeded = 0;
    let failed = 0;

    for (const s of selected) {
      console.log(pc.dim(`  Adding ${s.title.slice(0, 40)}... (x${s.quantity})`));
      try {
        await productPage.addToCart(s.asin, s.quantity);
        console.log(pc.green(`  Added!`));
        succeeded++;
      } catch (err) {
        console.log(pc.red(`  Failed to add ${s.asin}: ${err instanceof Error ? err.message : 'unknown error'}`));
        failed++;
      }
    }

    console.log('');
    if (failed > 0) {
      console.log(pc.yellow(`  Summary: ${succeeded} added, ${failed} failed out of ${selected.length} items.\n`));
    }

    const checkout = await confirmAction('Proceed to checkout?');
    if (checkout) {
      console.log(pc.dim('  Run `amz checkout` to complete your order.\n'));
    }
  });
}
