import pc from 'picocolors';
import { getPage, closeSession, type SessionOptions } from '../browser/session.js';
import { OrdersPage } from '../pages/orders.page.js';
import { formatOrders } from '../ui/formatters.js';

export async function ordersCommand(period: string | undefined, opts: SessionOptions): Promise<void> {
  const page = await getPage(opts);
  const ordersPage = new OrdersPage(page);

  console.log(pc.dim(`\n  Loading orders (${period ?? '3m'})...\n`));
  const orders = await ordersPage.getOrders(period ?? '3m');
  console.log(formatOrders(orders));
  await closeSession();
}

export async function orderDetailCommand(orderId: string, opts: SessionOptions): Promise<void> {
  const page = await getPage(opts);
  const ordersPage = new OrdersPage(page);

  console.log(pc.dim(`\n  Loading order ${orderId}...\n`));
  const order = await ordersPage.getOrderDetail(orderId);

  if (order) {
    console.log(formatOrders([order]));
  } else {
    console.log(pc.yellow(`\n  Order ${orderId} not found.\n`));
  }

  await closeSession();
}
