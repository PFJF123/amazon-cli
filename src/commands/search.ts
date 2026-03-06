import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { SearchPage, type SearchOptions } from '../pages/search.page.js';
import { ProductPage } from '../pages/product.page.js';
import { formatProductTable, formatJson } from '../ui/formatters.js';
import { selectProducts } from '../ui/prompts.js';

interface SearchCommandOpts extends SessionOptions {
  sort?: string;
  prime?: boolean;
  maxPrice?: number;
  limit?: number;
  add?: boolean;
  output?: string;
}

export async function searchCommand(query: string, opts: SearchCommandOpts): Promise<void> {
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const searchPage = new SearchPage(page);

    const searchOpts: SearchOptions = {
      sort: opts.sort,
      prime: opts.prime,
      maxPrice: opts.maxPrice,
      limit: opts.limit ?? 10,
    };

    if (!isJson) console.log(pc.dim(`\n  Searching for "${query}"...\n`));
    const products = await searchPage.search(query, searchOpts);

    if (isJson) {
      console.log(formatJson(products));
      return;
    }

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
  });
}
