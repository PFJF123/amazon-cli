import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { CartPage } from '../pages/cart.page.js';
import { ProductPage } from '../pages/product.page.js';
import { formatCart, formatJson } from '../ui/formatters.js';
import { confirmAction } from '../ui/prompts.js';
import { validateAsin } from '../utils/validate.js';

interface CartListOpts extends SessionOptions {
  output?: string;
}

export async function cartListCommand(opts: CartListOpts): Promise<void> {
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const cartPage = new CartPage(page);

    if (!isJson) console.log(pc.dim('\n  Loading cart...\n'));
    const contents = await cartPage.listItems();
    const { items, subtotal, groceryItems, grocerySubtotal } = contents;

    if (isJson) {
      console.log(formatJson(contents));
      return;
    }

    const hasRegular = items.length > 0;
    const hasGrocery = groceryItems.length > 0;

    if (!hasRegular && !hasGrocery) {
      console.log(pc.dim('  Your cart is empty.\n'));
      return;
    }

    if (hasRegular) {
      console.log(pc.bold('  Amazon Cart'));
      console.log(formatCart(items, subtotal));
    }

    if (hasGrocery) {
      console.log(pc.bold('  Whole Foods / Fresh Cart'));
      console.log(formatCart(groceryItems, grocerySubtotal));
    }
  });
}

export async function cartAddCommand(asin: string, qty: string | undefined, opts: SessionOptions): Promise<void> {
  validateAsin(asin);
  await withSession(opts, async (page) => {
    const productPage = new ProductPage(page);
    const quantity = qty ? parseInt(qty) : 1;

    console.log(pc.dim(`\n  Adding ${asin} (qty: ${quantity}) to cart...\n`));
    await productPage.addToCart(asin, quantity);
    console.log(pc.green(`  Added to cart!\n`));
  });
}

export async function cartRemoveCommand(asin: string, opts: SessionOptions): Promise<void> {
  validateAsin(asin);
  await withSession(opts, async (page) => {
    const cartPage = new CartPage(page);

    console.log(pc.dim(`\n  Removing ${asin} from cart...\n`));
    const removed = await cartPage.removeItem(asin);
    if (removed) {
      console.log(pc.green(`  Removed from cart.\n`));
    } else {
      console.log(pc.yellow(`  Item ${asin} not found in cart.\n`));
    }
  });
}

export async function cartUpdateCommand(asin: string, qty: string, opts: SessionOptions): Promise<void> {
  validateAsin(asin);
  const quantity = parseInt(qty);
  if (isNaN(quantity) || quantity < 1) {
    console.log(pc.red('\n  Quantity must be a positive number.\n'));
    return;
  }

  await withSession(opts, async (page) => {
    const cartPage = new CartPage(page);

    console.log(pc.dim(`\n  Updating ${asin} to qty ${quantity}...\n`));
    const updated = await cartPage.updateQuantity(asin, quantity);
    if (updated) {
      console.log(pc.green(`  Updated quantity to ${quantity}.\n`));
    } else {
      console.log(pc.yellow(`  Item ${asin} not found in cart.\n`));
    }
  });
}

export async function cartClearCommand(opts: SessionOptions): Promise<void> {
  const confirmed = await confirmAction('Clear all items from cart?');
  if (!confirmed) return;

  await withSession(opts, async (page) => {
    const cartPage = new CartPage(page);

    console.log(pc.dim('\n  Clearing cart...\n'));
    const removed = await cartPage.clearCart();
    console.log(pc.green(`  Removed ${removed} item(s) from cart.\n`));
  });
}
