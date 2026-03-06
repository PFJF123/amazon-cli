import pc from 'picocolors';
import { getPage, closeSession, type SessionOptions } from '../browser/session.js';
import { SearchPage, type SearchOptions } from '../pages/search.page.js';
import { ProductPage } from '../pages/product.page.js';
import { formatProductTable } from '../ui/formatters.js';
import { selectProducts } from '../ui/prompts.js';

interface SearchCommandOpts extends SessionOptions {
  sort?: string;
  prime?: boolean;
  maxPrice?: number;
  limit?: number;
  add?: boolean;
}

export async function searchCommand(query: string, opts: SearchCommandOpts): Promise<void> {
  const page = await getPage(opts);
  const searchPage = new SearchPage(page);

  const searchOpts: SearchOptions = {
    sort: opts.sort,
    prime: opts.prime,
    maxPrice: opts.maxPrice,
    limit: opts.limit ?? 10,
  };

  console.log(pc.dim(`\n  Searching for "${query}"...\n`));
  const products = await searchPage.search(query, searchOpts);
  console.log(formatProductTable(products));

  if (opts.add && products.length > 0) {
    const selected = await selectProducts(products);
    if (selected.length > 0) {
      const productPage = new ProductPage(page);
      for (const p of selected) {
        console.log(pc.dim(`  Adding ${p.asin} to cart...`));
        await productPage.addToCart(p.asin);
        console.log(pc.green(`  Added: ${p.title.slice(0, 50)}`));
      }
      console.log('');
    }
  }

  await closeSession();
}
