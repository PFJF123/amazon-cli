import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { GroceryPage, type GroceryStore, type FulfillmentMode } from '../pages/grocery.page.js';
import { AddressPage } from '../pages/address.page.js';
import { formatProductTable } from '../ui/formatters.js';
import { selectProducts } from '../ui/prompts.js';

const VALID_STORES: GroceryStore[] = ['wholefoods', 'fresh'];

interface GrocerySearchOpts extends SessionOptions {
  store?: string;
  limit?: number;
  add?: boolean;
  pickup?: boolean;
}

interface GroceryAddOpts extends SessionOptions {
  pickup?: boolean;
}

function validateStore(store: string | undefined): GroceryStore {
  const value = store ?? 'wholefoods';
  if (!VALID_STORES.includes(value as GroceryStore)) {
    console.error(pc.red(`\n  Invalid store "${value}". Must be one of: ${VALID_STORES.join(', ')}\n`));
    process.exit(1);
  }
  return value as GroceryStore;
}

export async function grocerySetAddressCommand(query: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const addressPage = new AddressPage(page);

    console.log(pc.dim(`\n  Setting delivery address to "${query}"...\n`));
    const success = await addressPage.setAddress(query);

    if (success) {
      console.log(pc.green(`  Delivery address updated!\n`));
    } else {
      console.log(pc.yellow(`  Could not find address matching "${query}". Check your saved addresses on Amazon.\n`));
    }
  });
}

export async function groceryInfoCommand(asin: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);

    console.log(pc.dim(`\n  Checking delivery info for ${asin}...\n`));
    const info = await groceryPage.getDeliveryInfo(asin);

    console.log(`  ${pc.dim('Location:')}  ${info.location ?? pc.yellow('Not set')}`);
    console.log(`  ${pc.dim('Delivery:')}  ${info.hasDelivery ? pc.green('Available') : pc.red('Not available')}`);
    if (info.deliveryMessage) {
      console.log(`              ${pc.dim(info.deliveryMessage)}`);
    }
    console.log(`  ${pc.dim('Pickup:')}    ${info.hasPickup ? pc.green('Available') : pc.red('Not available')}`);
    console.log('');
  });
}

export async function grocerySearchCommand(query: string, opts: GrocerySearchOpts): Promise<void> {
  const store = validateStore(opts.store);

  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);
    const mode: FulfillmentMode = opts.pickup ? 'pickup' : 'delivery';

    console.log(pc.dim(`\n  Searching ${store === 'wholefoods' ? 'Whole Foods' : 'Amazon Fresh'} for "${query}"...\n`));
    const products = await groceryPage.search(query, store, opts.limit ?? 10);

    if (products.length === 0 && store === 'fresh') {
      console.log(pc.yellow('  Amazon Fresh is not available for your delivery address.\n'));
      return;
    }

    console.log(formatProductTable(products));

    if (opts.add && products.length > 0) {
      const selected = await selectProducts(products);
      if (selected.length > 0) {
        for (const p of selected) {
          console.log(pc.dim(`  Adding ${p.asin} to cart (${mode})...`));
          await groceryPage.addToCart(p.asin, 1, mode);
          console.log(pc.green(`  Added: ${p.title.slice(0, 50)}`));
        }
        console.log('');
      }
    }
  });
}

export async function groceryCategoriesCommand(opts: GrocerySearchOpts): Promise<void> {
  const store = validateStore(opts.store);

  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);

    console.log(pc.dim(`\n  Loading ${store === 'wholefoods' ? 'Whole Foods' : 'Amazon Fresh'} categories...\n`));
    const categories = await groceryPage.getCategories(store);

    if (categories.length === 0) {
      console.log(pc.yellow('  No categories found.\n'));
      return;
    }

    console.log(pc.bold('  Categories:\n'));
    for (const cat of categories) {
      console.log(`  ${pc.cyan('•')} ${cat.name}`);
    }
    console.log('');
  });
}

export async function groceryBrowseCommand(category: string, opts: GrocerySearchOpts): Promise<void> {
  const store = validateStore(opts.store);

  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);
    const mode: FulfillmentMode = opts.pickup ? 'pickup' : 'delivery';

    console.log(pc.dim(`\n  Finding category "${category}"...\n`));
    const categories = await groceryPage.getCategories(store);
    const match = categories.find(
      (c) => c.name.toLowerCase().includes(category.toLowerCase()),
    );

    if (!match) {
      console.log(pc.yellow(`  Category "${category}" not found. Use \`amz grocery categories\` to see options.\n`));
      return;
    }

    console.log(pc.dim(`  Browsing ${match.name}...\n`));
    const products = await groceryPage.browseCategory(match.url, opts.limit ?? 10);
    console.log(formatProductTable(products));

    if (opts.add && products.length > 0) {
      const selected = await selectProducts(products);
      if (selected.length > 0) {
        for (const p of selected) {
          console.log(pc.dim(`  Adding ${p.asin} to cart (${mode})...`));
          await groceryPage.addToCart(p.asin, 1, mode);
          console.log(pc.green(`  Added: ${p.title.slice(0, 50)}`));
        }
        console.log('');
      }
    }
  });
}

export async function groceryAddCommand(asin: string, qty: string | undefined, opts: GroceryAddOpts): Promise<void> {
  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);
    const quantity = qty ? parseInt(qty) : 1;
    const mode: FulfillmentMode = opts.pickup ? 'pickup' : 'delivery';

    console.log(pc.dim(`\n  Adding grocery item ${asin} (qty: ${quantity}, ${mode}) to cart...\n`));
    const success = await groceryPage.addToCart(asin, quantity, mode);
    if (success) {
      console.log(pc.green(`  Added to cart!\n`));
    } else {
      console.log(pc.yellow(`  Could not add to cart. Item may be unavailable for ${mode}.\n`));
    }
  });
}
