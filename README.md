# amz — Amazon Shopping CLI

A command-line interface for Amazon shopping. Search products, manage your cart, place orders, handle Whole Foods & Fresh groceries, track deliveries, and manage Subscribe & Save — all from your terminal.

Built with [Playwright](https://playwright.dev/) for browser automation and [Commander.js](https://github.com/tj/commander.js/) for the CLI framework.

## Features

- **Search** — Find products with filters for price, Prime eligibility, and sort order
- **Product details** — View pricing, ratings, and availability for any ASIN
- **Cart management** — Add, remove, update quantities, and clear your cart
- **Checkout** — Review order summary, select delivery slots, and place orders
- **Whole Foods & Fresh** — Search, browse categories, add grocery items with delivery or pickup
- **Grocery checkout** — Separate checkout flow for WF/Fresh with delivery window selection
- **Order history** — View past orders, track packages, and get delivery ETAs
- **Reorder** — Re-add all items from any past order to your cart in one command
- **Staples** — Save frequently ordered items and batch-add them to cart
- **Subscribe & Save** — View subscriptions, check S&S availability, subscribe to products
- **Address management** — List saved addresses and switch delivery location
- **CAPTCHA handling** — Pauses and waits for you to solve CAPTCHAs in the browser, then resumes automatically

## Prerequisites

- **Node.js** 22+
- **Google Chrome** installed locally
- **Playwright** (installed as a dependency)

## Install

```bash
git clone https://github.com/justinfeldstein/amazon-cli.git
cd amazon-cli
npm install
npm run build
npm link  # makes `amz` available globally
```

## Quick Start

```bash
# Log in (opens Chrome for manual login — session is saved)
amz login

# Search for products
amz search "coffee beans" --limit 5

# View product details
amz product B0ASIN1234

# Add to cart and checkout
amz cart add B0ASIN1234
amz checkout --dry-run
amz checkout
```

## Usage

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
amz orders list 1y             # last year
amz orders detail 112-1234567-1234567
amz orders track 112-1234567-1234567
amz orders reorder 112-1234567-1234567  # re-add all items to cart
```

### Grocery (Whole Foods & Amazon Fresh)

```bash
# Set your delivery address
amz grocery setaddress "Main St"

# Search and browse
amz grocery search "organic milk"
amz grocery search "eggs" --store fresh
amz grocery categories
amz grocery browse "produce" --add

# Add items
amz grocery add B0ASIN1234              # delivery
amz grocery add B0ASIN1234 --pickup     # pickup

# Check availability
amz grocery info B0ASIN1234

# Checkout grocery cart
amz checkout --grocery
```

### Staples (Saved Items)

```bash
amz staples list
amz staples add --asin B0ASIN1234 --qty 2 --category "Household"
amz staples add                      # interactive prompt
amz staples remove B0ASIN1234
amz staples order                    # multi-select and add to cart
amz staples order "Household"        # filter by category
```

### Subscribe & Save

```bash
amz subscribe list                   # view active subscriptions
amz subscribe info B0ASIN1234        # check if S&S is available
amz subscribe add B0ASIN1234         # subscribe and add to cart
amz subscribe add B0ASIN1234 --frequency 3  # select delivery frequency
```

### Address Management

```bash
amz address list                     # show saved addresses
amz address set "Main St"            # switch active delivery address
```

### Global Options

```bash
--headless       # run browser without visible window
--debug          # show stack traces on errors
--timeout <ms>   # browser timeout (default: 30000)
```

## How It Works

`amz` uses Playwright to drive a real Chrome browser with a persistent profile. Your Amazon session (cookies, login state) is saved locally in `data/chrome-profile/` so you only need to log in once.

The CLI never stores your Amazon password. Authentication happens through the normal Amazon login flow in the browser window.

## Project Structure

```
src/
├── index.ts              # CLI entry point & command definitions
├── browser/
│   ├── session.ts        # Browser lifecycle (launch, close, withSession)
│   └── humanize.ts       # Human-like delays
├── commands/             # Command handlers
│   ├── login.ts
│   ├── search.ts
│   ├── product.ts
│   ├── cart.ts
│   ├── checkout.ts
│   ├── orders.ts
│   ├── grocery.ts
│   ├── staples.ts
│   ├── subscribe.ts
│   └── address.ts
├── pages/                # Page objects (Playwright interactions)
│   ├── base.page.ts      # Shared logic: selectors, auth, CAPTCHA
│   ├── login.page.ts
│   ├── search.page.ts
│   ├── product.page.ts
│   ├── cart.page.ts
│   ├── checkout.page.ts
│   ├── grocery-checkout.page.ts
│   ├── grocery.page.ts
│   ├── orders.page.ts
│   └── subscribe.page.ts
├── selectors/
│   └── index.ts          # CSS selector chains (resilient to layout changes)
├── models/
│   └── product.ts        # TypeScript interfaces
├── store/
│   └── staples-store.ts  # Local JSON persistence for staples
├── ui/
│   ├── formatters.ts     # Table & detail output formatting
│   └── prompts.ts        # Interactive prompts (confirm, multi-select)
├── errors/
│   └── index.ts          # Custom error classes
└── utils/
    └── paths.ts          # Data directory paths
```

## Development

```bash
npm run dev -- search "test"   # run from source with tsx
npm run build                  # compile with tsup
npm start -- search "test"     # run compiled output
```

## Notes

- Amazon's DOM changes frequently. If selectors break, update `src/selectors/index.ts`. Each selector is defined as a chain of fallbacks — the first match wins.
- CAPTCHA may trigger during heavy use. The CLI will pause and wait for you to solve it in the browser.
- Whole Foods and Amazon Fresh have separate checkout flows from regular Amazon. Use `--grocery` with checkout.
- The `data/` directory is gitignored and contains your browser profile and staples list. Do not share it.

## License

MIT
