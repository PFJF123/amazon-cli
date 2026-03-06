import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { ProductPage } from '../pages/product.page.js';
import { formatProductDetail, formatJson } from '../ui/formatters.js';
import { validateAsin } from '../utils/validate.js';

interface ProductCommandOpts extends SessionOptions {
  add?: boolean;
  output?: string;
}

export async function productCommand(asin: string, opts: ProductCommandOpts): Promise<void> {
  validateAsin(asin);
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const productPage = new ProductPage(page);

    if (!isJson) console.log(pc.dim(`\n  Loading product ${asin}...\n`));
    const product = await productPage.getProduct(asin);

    if (isJson) {
      console.log(formatJson(product));
      return;
    }

    console.log(formatProductDetail(product));

    if (opts.add) {
      console.log(pc.dim('  Adding to cart...'));
      await productPage.addToCart(asin);
      console.log(pc.green('  Added to cart!\n'));
    }
  });
}
