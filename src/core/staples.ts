import type { Page } from 'playwright';
import { ProductPage } from '../pages/product.page.js';
import type { Staple } from '../models/product.js';

// Re-export store functions for convenience
export { listStaples, addStaple, removeStaple, getCategories, seedStaples, DEFAULT_STAPLES } from '../store/staples-store.js';

export async function orderStaples(page: Page, items: Staple[]): Promise<{ succeeded: number; failed: number }> {
  const productPage = new ProductPage(page);
  let succeeded = 0;
  let failed = 0;

  for (const s of items) {
    try {
      await productPage.addToCart(s.asin, s.quantity);
      succeeded++;
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}
