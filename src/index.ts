import { Command } from 'commander';
import { handleError } from './errors/index.js';
import { loginCommand } from './commands/login.js';
import { searchCommand } from './commands/search.js';
import { productCommand } from './commands/product.js';
import { cartListCommand, cartAddCommand, cartRemoveCommand, cartUpdateCommand, cartClearCommand } from './commands/cart.js';
import { staplesListCommand, staplesAddCommand, staplesRemoveCommand, staplesOrderCommand } from './commands/staples.js';
import { ordersCommand, orderDetailCommand, orderTrackCommand, orderReorderCommand } from './commands/orders.js';
import { checkoutCommand } from './commands/checkout.js';
import { grocerySearchCommand, groceryCategoriesCommand, groceryBrowseCommand, groceryAddCommand, grocerySetAddressCommand, groceryInfoCommand } from './commands/grocery.js';
import { addressListCommand, addressSetCommand } from './commands/address.js';
import { subscribeListCommand, subscribeInfoCommand, subscribeAddCommand } from './commands/subscribe.js';

const program = new Command();

program
  .name('amz')
  .description('Personal Amazon shopping CLI')
  .version('1.0.0')
  .option('--headed', 'Run browser in headed mode (default)', true)
  .option('--headless', 'Run browser in headless mode')
  .option('--debug', 'Enable debug output')
  .option('--timeout <ms>', 'Browser timeout in milliseconds', '30000');

function getGlobalOpts() {
  const opts = program.opts();
  if (opts.debug) {
    process.env.AMZ_DEBUG = '1';
  }
  return {
    headless: opts.headless ?? false,
    timeout: parseInt(opts.timeout),
    debug: opts.debug ?? false,
  };
}

function wrapAction<T extends (...args: any[]) => Promise<void>>(fn: T): (...args: Parameters<T>) => Promise<void> {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      handleError(err);
    }
  };
}

// amz login
program
  .command('login')
  .description('Log in to Amazon (opens browser for manual login)')
  .action(wrapAction(async () => {
    await loginCommand(getGlobalOpts());
  }));

// amz search <query>
program
  .command('search <query>')
  .description('Search for products')
  .option('--sort <type>', 'Sort: price-asc, price-desc, rating, newest, best-seller')
  .option('--prime', 'Filter Prime-eligible only')
  .option('--max-price <price>', 'Maximum price filter', parseFloat)
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .action(wrapAction(async (query, opts) => {
    await searchCommand(query, { ...getGlobalOpts(), ...opts });
  }));

// amz product <ASIN>
program
  .command('product <asin>')
  .description('View product details')
  .option('--add', 'Add to cart')
  .action(wrapAction(async (asin, opts) => {
    await productCommand(asin, { ...getGlobalOpts(), ...opts });
  }));

// amz cart
const cart = program.command('cart').description('Manage shopping cart');

cart
  .command('list')
  .description('Show cart contents')
  .action(wrapAction(async () => {
    await cartListCommand(getGlobalOpts());
  }));

cart
  .command('add <asin> [qty]')
  .description('Add product to cart')
  .action(wrapAction(async (asin, qty) => {
    await cartAddCommand(asin, qty, getGlobalOpts());
  }));

cart
  .command('update <asin> <qty>')
  .description('Update item quantity in cart')
  .action(wrapAction(async (asin, qty) => {
    await cartUpdateCommand(asin, qty, getGlobalOpts());
  }));

cart
  .command('remove <asin>')
  .description('Remove product from cart')
  .action(wrapAction(async (asin) => {
    await cartRemoveCommand(asin, getGlobalOpts());
  }));

cart
  .command('clear')
  .description('Clear all items from cart')
  .action(wrapAction(async () => {
    await cartClearCommand(getGlobalOpts());
  }));

// amz staples
const staples = program.command('staples').description('Manage staple items');

staples
  .command('list [category]')
  .description('List saved staples')
  .action((category: string | undefined) => {
    try {
      staplesListCommand(category);
    } catch (err) {
      handleError(err);
    }
  });

staples
  .command('add')
  .description('Add a staple item')
  .option('--asin <asin>', 'Product ASIN')
  .option('--qty <quantity>', 'Quantity')
  .option('--category <category>', 'Category name')
  .action(wrapAction(async (opts) => {
    await staplesAddCommand({ ...getGlobalOpts(), ...opts });
  }));

staples
  .command('remove <name-or-asin>')
  .description('Remove a staple')
  .action((nameOrAsin: string) => {
    try {
      staplesRemoveCommand(nameOrAsin);
    } catch (err) {
      handleError(err);
    }
  });

staples
  .command('order [category]')
  .description('Order staples (multi-select, add to cart)')
  .action(wrapAction(async (category) => {
    await staplesOrderCommand(category, getGlobalOpts());
  }));

// amz orders
const orders = program.command('orders').description('View order history');

orders
  .command('list [period]')
  .description('View orders (3m, 6m, 1y)')
  .action(wrapAction(async (period) => {
    await ordersCommand(period, getGlobalOpts());
  }));

// Make `amz orders` without subcommand also list orders
orders.action(wrapAction(async (_opts, cmd) => {
  if (cmd.args.length === 0) {
    await ordersCommand(undefined, getGlobalOpts());
  }
}));

orders
  .command('detail <id>')
  .description('View specific order details')
  .action(wrapAction(async (id) => {
    await orderDetailCommand(id, getGlobalOpts());
  }));

orders
  .command('track <id>')
  .description('Track a specific order')
  .action(wrapAction(async (id) => {
    await orderTrackCommand(id, getGlobalOpts());
  }));

orders
  .command('reorder <id>')
  .description('Re-add all items from a past order to cart')
  .action(wrapAction(async (id) => {
    await orderReorderCommand(id, getGlobalOpts());
  }));

// amz grocery
const grocery = program.command('grocery').description('Whole Foods & Amazon Fresh grocery shopping');

grocery
  .command('setaddress <query>')
  .description('Set delivery address (matches against saved addresses)')
  .action(wrapAction(async (query) => {
    await grocerySetAddressCommand(query, getGlobalOpts());
  }));

grocery
  .command('info <asin>')
  .description('Check delivery/pickup availability for a grocery item')
  .action(wrapAction(async (asin) => {
    await groceryInfoCommand(asin, getGlobalOpts());
  }));

grocery
  .command('search <query>')
  .description('Search grocery items')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .option('--pickup', 'Add items for pickup instead of delivery')
  .action(wrapAction(async (query, opts) => {
    await grocerySearchCommand(query, { ...getGlobalOpts(), ...opts });
  }));

grocery
  .command('categories')
  .description('List grocery categories')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .action(wrapAction(async (opts) => {
    await groceryCategoriesCommand({ ...getGlobalOpts(), ...opts });
  }));

grocery
  .command('browse <category>')
  .description('Browse a grocery category')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .option('--pickup', 'Add items for pickup instead of delivery')
  .action(wrapAction(async (category, opts) => {
    await groceryBrowseCommand(category, { ...getGlobalOpts(), ...opts });
  }));

grocery
  .command('add <asin> [qty]')
  .description('Add grocery item to cart')
  .option('--pickup', 'Add for pickup instead of delivery')
  .action(wrapAction(async (asin, qty, opts) => {
    await groceryAddCommand(asin, qty, { ...getGlobalOpts(), ...opts });
  }));

// amz address
const address = program.command('address').description('Manage delivery addresses');

address
  .command('list')
  .description('Show saved addresses')
  .action(wrapAction(async () => {
    await addressListCommand(getGlobalOpts());
  }));

address
  .command('set <query>')
  .description('Set active delivery address (matches against saved addresses)')
  .action(wrapAction(async (query) => {
    await addressSetCommand(query, getGlobalOpts());
  }));

// amz subscribe
const subscribe = program.command('subscribe').description('Manage Subscribe & Save');

subscribe
  .command('list')
  .description('List active subscriptions')
  .action(wrapAction(async () => {
    await subscribeListCommand(getGlobalOpts());
  }));

subscribe
  .command('info <asin>')
  .description('Check if a product supports Subscribe & Save')
  .action(wrapAction(async (asin) => {
    await subscribeInfoCommand(asin, getGlobalOpts());
  }));

subscribe
  .command('add <asin>')
  .description('Subscribe to a product and add to cart')
  .option('--frequency <n>', 'Frequency option (1-based index from `subscribe info`)', parseInt)
  .action(wrapAction(async (asin, opts) => {
    await subscribeAddCommand(asin, { ...getGlobalOpts(), ...opts });
  }));

// amz checkout
program
  .command('checkout')
  .description('Checkout cart')
  .option('--dry-run', 'Show summary without purchasing')
  .option('--grocery', 'Checkout Whole Foods / Amazon Fresh cart')
  .option('--slot <index>', 'Select delivery slot by index', parseInt)
  .action(wrapAction(async (opts) => {
    await checkoutCommand({ ...getGlobalOpts(), ...opts });
  }));

program.parse();
