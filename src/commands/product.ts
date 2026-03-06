import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { ProductPage } from '../pages/product.page.js';
import { formatProductDetail } from '../ui/formatters.js';

interface ProductCommandOpts extends SessionOptions {
  add?: boolean;
}

export async function productCommand(asin: string, opts: ProductCommandOpts): Promise<void> {
  await withSession(opts, async (page) => {
    const productPage = new ProductPage(page);

    console.log(pc.dim(`\n  Loading product ${asin}...\n`));
    const product = await productPage.getProduct(asin);
    console.log(formatProductDetail(product));

    if (opts.add) {
      console.log(pc.dim('  Adding to cart...'));
      await productPage.addToCart(asin);
      console.log(pc.green('  Added to cart!\n'));
    }
  });
}
