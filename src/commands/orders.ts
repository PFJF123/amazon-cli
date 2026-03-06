import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { OrdersPage } from '../pages/orders.page.js';
import { ProductPage } from '../pages/product.page.js';
import { formatOrders, formatJson } from '../ui/formatters.js';
import { confirmAction } from '../ui/prompts.js';

interface OrdersListOpts extends SessionOptions {
  output?: string;
}

export async function ordersCommand(period: string | undefined, opts: OrdersListOpts): Promise<void> {
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    if (!isJson) console.log(pc.dim(`\n  Loading orders (${period ?? '3m'})...\n`));
    const orders = await ordersPage.getOrders(period ?? '3m');

    if (isJson) {
      console.log(formatJson(orders));
    } else {
      console.log(formatOrders(orders));
    }
  });
}

export async function orderDetailCommand(orderId: string, opts: OrdersListOpts): Promise<void> {
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    if (!isJson) console.log(pc.dim(`\n  Loading order ${orderId}...\n`));
    const order = await ordersPage.getOrderDetail(orderId);

    if (!order) {
      console.log(pc.yellow(`\n  Order ${orderId} not found.\n`));
      return;
    }

    if (isJson) {
      console.log(formatJson(order));
    } else {
      console.log(formatOrders([order]));
    }
  });
}

export async function orderTrackCommand(orderId: string, opts: OrdersListOpts): Promise<void> {
  const isJson = opts.output === 'json';
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    if (!isJson) console.log(pc.dim(`\n  Loading tracking info for ${orderId}...\n`));
    const order = await ordersPage.getOrderDetail(orderId);

    if (!order) {
      console.log(pc.yellow(`  Order ${orderId} not found.\n`));
      return;
    }

    if (isJson) {
      console.log(formatJson({
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        trackingUrl: order.trackingUrl,
      }));
      return;
    }

    console.log(pc.bold(`  Order ${pc.cyan(orderId)}`));
    console.log(`  ${pc.dim('Status:')} ${order.status}`);
    if (order.estimatedDelivery) {
      console.log(`  ${pc.dim('ETA:')}    ${pc.cyan(order.estimatedDelivery)}`);
    } else {
      console.log(`  ${pc.dim('ETA:')}    ${pc.dim('Not available')}`);
    }
    if (order.trackingUrl) {
      console.log(`  ${pc.dim('Track:')}  ${order.trackingUrl}`);
    } else {
      console.log(`  ${pc.dim('Track:')}  ${pc.dim('No tracking link available')}`);
    }
    console.log('');
  });
}

export async function orderReorderCommand(orderId: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    console.log(pc.dim(`\n  Loading items from order ${orderId}...\n`));
    const items = await ordersPage.getOrderItems(orderId);

    if (items.length === 0) {
      console.log(pc.yellow('  No items found in this order.\n'));
      return;
    }

    const reorderableItems = items.filter((i) => i.asin);
    const skippedItems = items.filter((i) => !i.asin);

    console.log(pc.bold('  Items to reorder:\n'));
    for (const item of reorderableItems) {
      const title = item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title;
      console.log(`    ${pc.cyan(item.asin!)}  ${title}`);
    }
    if (skippedItems.length > 0) {
      console.log(pc.dim(`\n  ${skippedItems.length} item(s) skipped (no ASIN found)`));
    }
    console.log('');

    if (reorderableItems.length === 0) {
      console.log(pc.yellow('  No reorderable items found.\n'));
      return;
    }

    const proceed = await confirmAction(`Add ${reorderableItems.length} item(s) to cart?`);
    if (!proceed) return;

    const productPage = new ProductPage(page);
    let succeeded = 0;
    let failed = 0;

    for (const item of reorderableItems) {
      const title = item.title.length > 40 ? item.title.slice(0, 37) + '...' : item.title;
      console.log(pc.dim(`  Adding ${title}...`));
      try {
        await productPage.addToCart(item.asin!);
        console.log(pc.green(`  Added!`));
        succeeded++;
      } catch (err) {
        console.log(pc.red(`  Failed: ${err instanceof Error ? err.message : 'unknown error'}`));
        failed++;
      }
    }

    console.log('');
    if (failed > 0) {
      console.log(pc.yellow(`  Summary: ${succeeded} added, ${failed} failed out of ${reorderableItems.length} items.`));
    } else {
      console.log(pc.green(`  All ${succeeded} items added to cart.`));
    }
    console.log(pc.dim('  Run `amz checkout` to complete your order.\n'));
  });
}

export async function orderCancelCommand(orderId: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    console.log(pc.dim(`\n  Looking for cancel option on order ${orderId}...\n`));
    const found = await ordersPage.cancelOrder(orderId);

    if (!found) {
      console.log(pc.yellow('  This order cannot be cancelled (may have already shipped or been delivered).\n'));
      return;
    }

    console.log(pc.dim('  Cancel page opened. Complete the cancellation in the browser window.'));
    console.log(pc.dim('  Press Enter when done...\n'));
    await new Promise<void>((resolve) => { process.stdin.once('data', () => resolve()); });
    console.log(pc.green('  Done.\n'));
  });
}

export async function orderReturnCommand(orderId: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const ordersPage = new OrdersPage(page);

    console.log(pc.dim(`\n  Looking for return option on order ${orderId}...\n`));
    const found = await ordersPage.initiateReturn(orderId);

    if (!found) {
      console.log(pc.yellow('  No return option found for this order (may not be eligible).\n'));
      return;
    }

    console.log(pc.dim('  Return page opened. Complete the return process in the browser window.'));
    console.log(pc.dim('  Press Enter when done...\n'));
    await new Promise<void>((resolve) => { process.stdin.once('data', () => resolve()); });
    console.log(pc.green('  Done.\n'));
  });
}
