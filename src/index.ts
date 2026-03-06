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

// amz login
program
  .command('login')
  .description('Log in to Amazon (opens browser for manual login)')
  .action(async () => {
    try {
      await loginCommand(getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// amz search <query>
program
  .command('search <query>')
  .description('Search for products')
  .option('--sort <type>', 'Sort: price-asc, price-desc, rating, newest, best-seller')
  .option('--prime', 'Filter Prime-eligible only')
  .option('--max-price <price>', 'Maximum price filter', parseFloat)
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .action(async (query, opts) => {
    try {
      await searchCommand(query, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

// amz product <ASIN>
program
  .command('product <asin>')
  .description('View product details')
  .option('--add', 'Add to cart')
  .action(async (asin, opts) => {
    try {
      await productCommand(asin, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

// amz cart
const cart = program.command('cart').description('Manage shopping cart');

cart
  .command('list')
  .description('Show cart contents')
  .action(async () => {
    try {
      await cartListCommand(getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

cart
  .command('add <asin> [qty]')
  .description('Add product to cart')
  .action(async (asin, qty) => {
    try {
      await cartAddCommand(asin, qty, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

cart
  .command('update <asin> <qty>')
  .description('Update item quantity in cart')
  .action(async (asin, qty) => {
    try {
      await cartUpdateCommand(asin, qty, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

cart
  .command('remove <asin>')
  .description('Remove product from cart')
  .action(async (asin) => {
    try {
      await cartRemoveCommand(asin, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

cart
  .command('clear')
  .description('Clear all items from cart')
  .action(async () => {
    try {
      await cartClearCommand(getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// amz staples
const staples = program.command('staples').description('Manage staple items');

staples
  .command('list [category]')
  .description('List saved staples')
  .action((category) => {
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
  .action(async (opts) => {
    try {
      await staplesAddCommand({ ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

staples
  .command('remove <name-or-asin>')
  .description('Remove a staple')
  .action((nameOrAsin) => {
    try {
      staplesRemoveCommand(nameOrAsin);
    } catch (err) {
      handleError(err);
    }
  });

staples
  .command('order [category]')
  .description('Order staples (multi-select, add to cart)')
  .action(async (category) => {
    try {
      await staplesOrderCommand(category, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// amz orders
const orders = program.command('orders').description('View order history');

orders
  .command('list [period]')
  .description('View orders (3m, 6m, 1y)')
  .action(async (period) => {
    try {
      await ordersCommand(period, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// Make `amz orders` without subcommand also list orders
orders.action(async (opts, cmd) => {
  if (cmd.args.length === 0) {
    try {
      await ordersCommand(undefined, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  }
});

orders
  .command('detail <id>')
  .description('View specific order details')
  .action(async (id) => {
    try {
      await orderDetailCommand(id, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

orders
  .command('track <id>')
  .description('Track a specific order')
  .action(async (id) => {
    try {
      await orderTrackCommand(id, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

orders
  .command('reorder <id>')
  .description('Re-add all items from a past order to cart')
  .action(async (id) => {
    try {
      await orderReorderCommand(id, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// amz grocery
const grocery = program.command('grocery').description('Whole Foods & Amazon Fresh grocery shopping');

grocery
  .command('setaddress <query>')
  .description('Set delivery address (matches against saved addresses)')
  .action(async (query) => {
    try {
      await grocerySetAddressCommand(query, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

grocery
  .command('info <asin>')
  .description('Check delivery/pickup availability for a grocery item')
  .action(async (asin) => {
    try {
      await groceryInfoCommand(asin, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

grocery
  .command('search <query>')
  .description('Search grocery items')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .option('--pickup', 'Add items for pickup instead of delivery')
  .action(async (query, opts) => {
    try {
      await grocerySearchCommand(query, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

grocery
  .command('categories')
  .description('List grocery categories')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .action(async (opts) => {
    try {
      await groceryCategoriesCommand({ ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

grocery
  .command('browse <category>')
  .description('Browse a grocery category')
  .option('--store <store>', 'Store: wholefoods or fresh (default: wholefoods)')
  .option('--limit <n>', 'Number of results', parseInt)
  .option('--add', 'Interactive: select results to add to cart')
  .option('--pickup', 'Add items for pickup instead of delivery')
  .action(async (category, opts) => {
    try {
      await groceryBrowseCommand(category, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

grocery
  .command('add <asin> [qty]')
  .description('Add grocery item to cart')
  .option('--pickup', 'Add for pickup instead of delivery')
  .action(async (asin, qty, opts) => {
    try {
      await groceryAddCommand(asin, qty, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

// amz address
const address = program.command('address').description('Manage delivery addresses');

address
  .command('list')
  .description('Show saved addresses')
  .action(async () => {
    try {
      await addressListCommand(getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

address
  .command('set <query>')
  .description('Set active delivery address (matches against saved addresses)')
  .action(async (query) => {
    try {
      await addressSetCommand(query, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

// amz subscribe
const subscribe = program.command('subscribe').description('Manage Subscribe & Save');

subscribe
  .command('list')
  .description('List active subscriptions')
  .action(async () => {
    try {
      await subscribeListCommand(getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

subscribe
  .command('info <asin>')
  .description('Check if a product supports Subscribe & Save')
  .action(async (asin) => {
    try {
      await subscribeInfoCommand(asin, getGlobalOpts());
    } catch (err) {
      handleError(err);
    }
  });

subscribe
  .command('add <asin>')
  .description('Subscribe to a product and add to cart')
  .option('--frequency <n>', 'Frequency option (1-based index from `subscribe info`)', parseInt)
  .action(async (asin, opts) => {
    try {
      await subscribeAddCommand(asin, { ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

// amz checkout
program
  .command('checkout')
  .description('Checkout cart')
  .option('--dry-run', 'Show summary without purchasing')
  .option('--grocery', 'Checkout Whole Foods / Amazon Fresh cart')
  .option('--slot <index>', 'Select delivery slot by index', parseInt)
  .action(async (opts) => {
    try {
      await checkoutCommand({ ...getGlobalOpts(), ...opts });
    } catch (err) {
      handleError(err);
    }
  });

program.parse();
