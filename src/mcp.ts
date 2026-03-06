import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getPage, resetIdleTimer } from './browser/session.js';
import { searchProducts } from './core/search.js';
import { getProduct, addToCart } from './core/product.js';
import { listCart, removeFromCart, updateCartQty, clearCart } from './core/cart.js';
import { listOrders, getOrder, trackOrder, reorderItems, cancelOrder, returnOrder } from './core/orders.js';
import { grocerySearch, groceryCategories, groceryBrowse, groceryAdd, grocerySetAddress, groceryInfo } from './core/grocery.js';
import { listSubscriptions, subscribeInfo, subscribeAdd } from './core/subscribe.js';
import { listStaples, addStaple, removeStaple, orderStaples } from './core/staples.js';
import { listAddresses, setAddress } from './core/address.js';
import { loadConfig, setConfigValue, getConfigValue } from './core/config.js';
import { getCheckoutSummary, placeOrder } from './core/checkout.js';
import { LoginPage } from './pages/login.page.js';
import type { ApiResponse } from './core/types.js';
import type { Staple } from './models/product.js';

// Non-interactive mode for MCP
process.env.AMZ_NON_INTERACTIVE = '1';

const server = new McpServer({
  name: 'amazon-mcp',
  version: '2.0.0',
});

async function withMcpSession<T>(fn: (page: import('playwright').Page) => Promise<T>, opts?: { headless?: boolean }): Promise<ApiResponse<T>> {
  try {
    const page = await getPage({ headless: opts?.headless ?? true });
    const data = await fn(page);
    resetIdleTimer();
    return { success: true, data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = err instanceof Error ? err.constructor.name : 'UnknownError';
    return { success: false, data: null, error: { code, message } };
  }
}

function mcpResult(result: ApiResponse<unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// --- Search & Products ---

server.tool('search_products', 'Search Amazon products',
  { query: z.string(), sort: z.string().optional(), prime: z.boolean().optional(), maxPrice: z.number().optional(), limit: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => searchProducts(p, args.query, { sort: args.sort, prime: args.prime, maxPrice: args.maxPrice, limit: args.limit ?? 10 })))
);

server.tool('get_product', 'Get product details by ASIN',
  { asin: z.string() },
  async (args) => mcpResult(await withMcpSession(p => getProduct(p, args.asin)))
);

server.tool('add_to_cart', 'Add a product to cart by ASIN',
  { asin: z.string(), quantity: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => addToCart(p, args.asin, args.quantity ?? 1)))
);

// --- Cart ---

server.tool('list_cart', 'List all items in the shopping cart',
  {},
  async () => mcpResult(await withMcpSession(p => listCart(p)))
);

server.tool('remove_from_cart', 'Remove an item from cart by ASIN',
  { asin: z.string() },
  async (args) => mcpResult(await withMcpSession(p => removeFromCart(p, args.asin)))
);

server.tool('update_cart_quantity', 'Update quantity of an item in cart',
  { asin: z.string(), quantity: z.number() },
  async (args) => mcpResult(await withMcpSession(p => updateCartQty(p, args.asin, args.quantity)))
);

server.tool('clear_cart', 'Clear all items from cart',
  {},
  async () => mcpResult(await withMcpSession(p => clearCart(p)))
);

// --- Checkout ---

server.tool('checkout', 'Checkout the cart. Dry run by default for safety.',
  { dryRun: z.boolean().optional(), grocery: z.boolean().optional(), slot: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => placeOrder(p, { dryRun: args.dryRun ?? true, grocery: args.grocery, slot: args.slot })))
);

// --- Orders ---

server.tool('list_orders', 'List recent orders',
  { period: z.string().optional() },
  async (args) => mcpResult(await withMcpSession(p => listOrders(p, args.period ?? '3m')))
);

server.tool('get_order', 'Get details of a specific order',
  { orderId: z.string() },
  async (args) => mcpResult(await withMcpSession(p => getOrder(p, args.orderId)))
);

server.tool('track_order', 'Track a specific order',
  { orderId: z.string() },
  async (args) => mcpResult(await withMcpSession(p => trackOrder(p, args.orderId)))
);

server.tool('reorder', 'Re-add all items from a past order to cart',
  { orderId: z.string() },
  async (args) => mcpResult(await withMcpSession(p => reorderItems(p, args.orderId)))
);

server.tool('cancel_order', 'Cancel an unshipped order',
  { orderId: z.string() },
  async (args) => mcpResult(await withMcpSession(p => cancelOrder(p, args.orderId)))
);

server.tool('return_order', 'Initiate a return for an order',
  { orderId: z.string() },
  async (args) => mcpResult(await withMcpSession(p => returnOrder(p, args.orderId)))
);

// --- Grocery ---

server.tool('grocery_search', 'Search grocery items on Whole Foods or Amazon Fresh',
  { query: z.string(), store: z.enum(['wholefoods', 'fresh']).optional(), limit: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => grocerySearch(p, args.query, args.store ?? 'wholefoods', args.limit ?? 10)))
);

server.tool('grocery_categories', 'List grocery categories',
  { store: z.enum(['wholefoods', 'fresh']).optional() },
  async (args) => mcpResult(await withMcpSession(p => groceryCategories(p, args.store ?? 'wholefoods')))
);

server.tool('grocery_browse', 'Browse a grocery category by URL',
  { categoryUrl: z.string(), limit: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => groceryBrowse(p, args.categoryUrl, args.limit ?? 10)))
);

server.tool('grocery_add', 'Add a grocery item to cart',
  { asin: z.string(), quantity: z.number().optional(), mode: z.enum(['delivery', 'pickup']).optional() },
  async (args) => mcpResult(await withMcpSession(p => groceryAdd(p, args.asin, args.quantity ?? 1, args.mode ?? 'delivery')))
);

server.tool('grocery_set_address', 'Set delivery address for grocery orders',
  { query: z.string() },
  async (args) => mcpResult(await withMcpSession(p => grocerySetAddress(p, args.query)))
);

server.tool('grocery_info', 'Check delivery/pickup availability for a grocery item',
  { asin: z.string() },
  async (args) => mcpResult(await withMcpSession(p => groceryInfo(p, args.asin)))
);

// --- Subscriptions ---

server.tool('list_subscriptions', 'List active Subscribe & Save subscriptions',
  {},
  async () => mcpResult(await withMcpSession(p => listSubscriptions(p)))
);

server.tool('subscribe_info', 'Check if a product supports Subscribe & Save',
  { asin: z.string() },
  async (args) => mcpResult(await withMcpSession(p => subscribeInfo(p, args.asin)))
);

server.tool('subscribe_add', 'Subscribe to a product and add to cart',
  { asin: z.string(), frequencyIndex: z.number().optional() },
  async (args) => mcpResult(await withMcpSession(p => subscribeAdd(p, args.asin, args.frequencyIndex ?? 0)))
);

// --- Staples (no browser needed) ---

server.tool('list_staples', 'List saved staple items',
  { category: z.string().optional() },
  async (args) => {
    const staples = listStaples(args.category);
    return mcpResult({ success: true, data: staples, error: null });
  }
);

server.tool('add_staple', 'Add a staple item',
  { asin: z.string(), title: z.string(), quantity: z.number().optional(), category: z.string().optional() },
  async (args) => {
    const staple: Staple = {
      asin: args.asin,
      title: args.title,
      quantity: args.quantity ?? 1,
      category: args.category ?? 'General',
      addedAt: new Date().toISOString(),
    };
    addStaple(staple);
    return mcpResult({ success: true, data: staple, error: null });
  }
);

server.tool('edit_staple', 'Edit a staple item quantity or category',
  { asin: z.string(), quantity: z.number().optional(), category: z.string().optional() },
  async (args) => {
    const all = listStaples();
    const existing = all.find(s => s.asin === args.asin);
    if (!existing) {
      return mcpResult({ success: false, data: null, error: { code: 'NotFound', message: `Staple ${args.asin} not found` } });
    }
    const updated: Staple = {
      ...existing,
      quantity: args.quantity ?? existing.quantity,
      category: args.category ?? existing.category,
    };
    addStaple(updated);
    return mcpResult({ success: true, data: updated, error: null });
  }
);

server.tool('remove_staple', 'Remove a staple item',
  { nameOrAsin: z.string() },
  async (args) => {
    const removed = removeStaple(args.nameOrAsin);
    return mcpResult({ success: true, data: { removed }, error: null });
  }
);

// --- Addresses ---

server.tool('list_addresses', 'List saved delivery addresses',
  {},
  async () => mcpResult(await withMcpSession(p => listAddresses(p)))
);

server.tool('set_address', 'Set active delivery address',
  { query: z.string() },
  async (args) => mcpResult(await withMcpSession(p => setAddress(p, args.query)))
);

// --- Config (no browser needed) ---

server.tool('get_config', 'Get configuration values',
  { key: z.string().optional() },
  async (args) => {
    if (args.key) {
      try {
        const val = getConfigValue(args.key);
        return mcpResult({ success: true, data: { [args.key]: val }, error: null });
      } catch (err) {
        return mcpResult({ success: false, data: null, error: { code: 'InvalidKey', message: err instanceof Error ? err.message : String(err) } });
      }
    }
    return mcpResult({ success: true, data: loadConfig(), error: null });
  }
);

server.tool('set_config', 'Set a configuration value',
  { key: z.string(), value: z.string() },
  async (args) => {
    try {
      setConfigValue(args.key, args.value);
      return mcpResult({ success: true, data: { [args.key]: args.value }, error: null });
    } catch (err) {
      return mcpResult({ success: false, data: null, error: { code: 'InvalidKey', message: err instanceof Error ? err.message : String(err) } });
    }
  }
);

// --- Login ---

server.tool('login', 'Log in to Amazon (opens headed browser for manual login)',
  {},
  async () => {
    return mcpResult(await withMcpSession(async (page) => {
      const loginPage = new LoginPage(page);
      const isLoggedIn = await loginPage.ensureLoggedIn();
      if (isLoggedIn) return { alreadyLoggedIn: true };
      await loginPage.navigateToLogin();
      const success = await loginPage.waitForManualLogin();
      return { success };
    }, { headless: false }));
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
