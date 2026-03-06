import type { Page } from 'playwright';
import { SearchPage, type SearchOptions } from '../pages/search.page.js';
import type { Product } from '../models/product.js';

export async function searchProducts(page: Page, query: string, opts: SearchOptions = {}): Promise<Product[]> {
  const searchPage = new SearchPage(page);
  return searchPage.search(query, opts);
}
