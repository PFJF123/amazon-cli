# amz - Amazon Shopping CLI

A command-line interface, MCP server, and programmatic API for Amazon shopping. Search products, manage your cart, place orders, handle Whole Foods & Fresh groceries, track deliveries, and manage Subscribe & Save.

Built with [Playwright](https://playwright.dev/), [Commander.js](https://github.com/tj/commander.js/), and the [Model Context Protocol](https://modelcontextprotocol.io/).

## Three Entry Points

```
amz search "coffee"                         # CLI
node dist/mcp.js                            # MCP server (stdio) for Claude Desktop
import { searchProducts } from 'amazon-cli' # Programmatic API
```

## Features

- **Search** - Find products with filters for price, Prime eligibility, and sort order
- **Product details** - View pricing, ratings, and availability for any ASIN
- **Cart management** - Add, remove, update quantities, and clear your cart
- **Checkout** - Review order summary, select delivery slots, and place orders
- **Whole Foods & Fresh** - Search, browse categories, add grocery items with delivery or pickup
- **Grocery checkout** - Separate checkout flow with delivery window selection
- **Order history** - View past orders, track packages, reorder, cancel, return
- **Staples** - Save frequently ordered items and batch-add them to cart
- **Subscribe & Save** - View subscriptions, check availability, subscribe to products
- **Address management** - List saved addresses and switch delivery location
- **CAPTCHA handling** - Pauses and waits for you to solve CAPTCHAs, then resumes
- **MCP server** - 32 tools for AI agents (Claude Desktop, etc.)
- **Non-interactive mode** - Auto-confirm prompts for scripting and MCP
- **Daily health check** - Automated test script to detect Amazon selector breakage

## Prerequisites

- **Node.js** 22+
- **Google Chrome** installed locally

## Install

```bash
git clone https://github.com/PFJF123/amazon-cli.git
cd amazon-cli
npm install
npm run build
npm link  # makes `amz` and `amazon-cli` available globally
```

## Quick Start

```bash
# Log in (opens Chrome for manual login - session is saved)
amz login

# Search for products
amz search "coffee beans" --limit 5

# Add to cart and checkout
amz cart add B0ASIN1234
amz checkout --dry-run
amz checkout
```

## CLI Usage

### Search

```bash
amz search "wireless earbuds"
amz search "batteries" --prime --max-price 20
amz search "hdmi cable" --sort price-asc --limit 3
amz search "notebook" --add  # interactive: select results to add to cart
```

Sort options: `price-asc`, `price-desc`, `rating`, `newest`, `best-seller`

### Product

```bash
amz product B0ASIN1234         # view details
amz product B0ASIN1234 --add   # view and add to cart
```

### Cart

```bash
amz cart list                  # show cart contents
amz cart add B0ASIN1234 2      # add 2 units
amz cart update B0ASIN1234 3   # change quantity to 3
amz cart remove B0ASIN1234     # remove item
amz cart clear                 # empty the cart
```

### Checkout

```bash
amz checkout                   # standard checkout flow
amz checkout --dry-run         # preview without purchasing
amz checkout --slot 2          # select delivery option #2
amz checkout --grocery         # checkout Whole Foods / Fresh cart
```

### Orders

```bash
amz orders list                # recent orders (default: 3 months)
amz orders list 6m             # last 6 months
amz orders detail 112-1234567-1234567
amz orders track 112-1234567-1234567
amz orders reorder 112-1234567-1234567
amz orders cancel 112-1234567-1234567
amz orders return 112-1234567-1234567
```

### Grocery (Whole Foods & Amazon Fresh)

```bash
amz grocery setaddress "Main St"
amz grocery search "organic milk"
amz grocery search "eggs" --store fresh
amz grocery categories
amz grocery browse "produce" --add
amz grocery add B0ASIN1234
amz grocery add B0ASIN1234 --pickup
amz grocery info B0ASIN1234
amz checkout --grocery
```

### Staples

```bash
amz staples list
amz staples add --asin B0ASIN1234 --qty 2 --category "Household"
amz staples add                      # interactive prompt
amz staples edit B0ASIN1234 --qty 3
amz staples remove B0ASIN1234
amz staples order                    # multi-select and add to cart
amz staples order "Household"        # filter by category
```

### Subscribe & Save

```bash
amz subscribe list
amz subscribe info B0ASIN1234
amz subscribe add B0ASIN1234
amz subscribe add B0ASIN1234 --frequency 3
```

### Address Management

```bash
amz address list
amz address set "Main St"
```

### Global Options

```
--headless           Run browser without visible window
--debug              Show stack traces on errors
--timeout <ms>       Browser timeout (default: 30000)
--output json        Output as JSON instead of tables
--non-interactive    Auto-confirm all prompts
```

### Non-interactive Mode

```bash
AMZ_NON_INTERACTIVE=1 amz cart clear    # auto-confirms
amz --non-interactive cart clear         # same thing
```

## MCP Server (for Claude Desktop)

Includes an MCP server with 32 tools that AI agents can use to shop on Amazon.

### Setup with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amazon": {
      "command": "node",
      "args": ["/path/to/amazon-cli/dist/mcp.js"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `search_products` | Search Amazon products |
| `get_product` | Get product details by ASIN |
| `add_to_cart` | Add product to cart |
| `list_cart` | List cart contents |
| `remove_from_cart` | Remove item from cart |
| `update_cart_quantity` | Update cart item quantity |
| `clear_cart` | Clear all cart items |
| `checkout` | Checkout (dry run by default) |
| `list_orders` | List recent orders |
| `get_order` | Get order details |
| `track_order` | Track an order |
| `reorder` | Re-add past order items to cart |
| `cancel_order` | Cancel an unshipped order |
| `return_order` | Initiate a return |
| `grocery_search` | Search grocery items |
| `grocery_categories` | List grocery categories |
| `grocery_browse` | Browse a grocery category |
| `grocery_add` | Add grocery item to cart |
| `grocery_set_address` | Set delivery address |
| `grocery_info` | Check delivery availability |
| `list_subscriptions` | List S&S subscriptions |
| `subscribe_info` | Check S&S availability |
| `subscribe_add` | Subscribe to a product |
| `list_staples` | List saved staples |
| `add_staple` | Add a staple item |
| `edit_staple` | Edit a staple |
| `remove_staple` | Remove a staple |
| `list_addresses` | List saved addresses |
| `set_address` | Set delivery address |
| `get_config` | Get configuration |
| `set_config` | Set configuration |
| `login` | Log in (opens headed browser) |

## Programmatic API

```typescript
import { searchProducts, addToCart, listCart, getPage, closeSession } from 'amazon-cli';

const page = await getPage({ headless: true });

const products = await searchProducts(page, 'coffee beans', { limit: 5 });
console.log(products);

await addToCart(page, products[0].asin);
const cart = await listCart(page);
console.log(cart);

await closeSession();
```

All core functions accept a Playwright `Page` as the first argument. Session management is up to you.

## Daily Health Check

A test script runs each major feature against live Amazon to detect selector breakage early.

```bash
npm run health          # run manually
```

Runs automatically daily at 8am via launchd. Logs are saved to `~/.amazon-cli/logs/`.

When tests fail, the output tells you which selector groups to update in `src/selectors/index.ts`.

## How It Works

Uses Playwright to drive a real Chrome browser with a persistent profile. Your Amazon session (cookies, login state) is saved in `~/.amazon-cli/chrome-profile/` so you only need to log in once.

The CLI never stores your Amazon password. Authentication happens through the normal Amazon login flow in the browser window.

## Data Directory

All data is stored in `~/.amazon-cli/`:
- `chrome-profile/` - Browser profile with session cookies
- `staples.json` - Saved staple items
- `config.json` - CLI configuration
- `logs/` - Health check logs

On first run, data is auto-migrated from the old `data/` directory if present.

## Project Structure

```
src/
├── cli.ts               # CLI entry point (Commander.js)
├── mcp.ts               # MCP server (stdio transport)
├── index.ts             # API exports (no side effects)
├── core/                # Pure logic layer (Page in, data out)
│   ├── types.ts
│   ├── search.ts, product.ts, cart.ts, orders.ts
│   ├── grocery.ts, checkout.ts, subscribe.ts
│   ├── staples.ts, address.ts, config.ts
├── browser/             # Browser lifecycle, idle timeout
├── commands/            # CLI command handlers (thin wrappers)
├── pages/               # Page objects (Playwright interactions)
├── selectors/           # CSS selector chains
├── models/              # TypeScript interfaces
├── store/               # Local JSON persistence
├── ui/                  # Formatters and interactive prompts
├── errors/              # Custom error classes
└── utils/               # Validation, paths
scripts/
└── health-check.ts      # Daily selector breakage tests
```

## Development

```bash
npm run dev -- search "test"   # run from source with tsx
npm run build                  # compile with tsup
npm start -- search "test"     # run compiled output
npm run mcp                    # start MCP server
npm run health                 # run health check
```

## Notes

- Amazon's DOM changes frequently. If selectors break, update `src/selectors/index.ts`.
- CAPTCHA may trigger during heavy use. The CLI pauses and waits for you to solve it.
- Whole Foods/Fresh have separate checkout flows. Use `--grocery` with checkout.
- The `~/.amazon-cli/` directory contains your browser profile. Do not share it.
- The MCP `checkout` tool defaults to `dryRun=true` for safety.

## License

MIT
