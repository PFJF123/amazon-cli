import pc from 'picocolors';
import type { Product, CartItem, Order, Staple } from '../models/product.js';

export function formatProductTable(products: Product[]): string {
  if (products.length === 0) return pc.dim('  No results found.\n');

  const lines: string[] = [];
  lines.push('');
  lines.push(pc.bold(`  ${'#'.padEnd(4)}${'ASIN'.padEnd(14)}${'Price'.padEnd(12)}${'Rating'.padEnd(10)}${'Prime'.padEnd(7)}Title`));
  lines.push(pc.dim(`  ${'─'.repeat(90)}`));

  products.forEach((p, i) => {
    const num = pc.dim(`${(i + 1).toString().padEnd(4)}`);
    const asin = pc.cyan(p.asin.padEnd(14));
    const price = p.price ? pc.green(`$${p.price.toFixed(2)}`.padEnd(12)) : pc.dim('N/A'.padEnd(12));
    const rating = p.rating ? pc.yellow(`${p.rating}/5`.padEnd(10)) : pc.dim('N/A'.padEnd(10));
    const prime = p.isPrime ? pc.blue('Yes'.padEnd(7)) : pc.dim('No'.padEnd(7));
    const title = p.title.length > 50 ? p.title.slice(0, 47) + '...' : p.title;
    lines.push(`  ${num}${asin}${price}${rating}${prime}${title}`);
  });

  lines.push('');
  return lines.join('\n');
}

export function formatProductDetail(p: Product): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(pc.bold(`  ${p.title}`));
  lines.push('');
  lines.push(`  ${pc.dim('ASIN:')}     ${pc.cyan(p.asin)}`);
  lines.push(`  ${pc.dim('Price:')}    ${p.price ? pc.green(`$${p.price.toFixed(2)}`) : pc.dim('N/A')}`);
  lines.push(`  ${pc.dim('Rating:')}   ${p.rating ? pc.yellow(`${p.rating}/5`) : pc.dim('N/A')}${p.reviewCount ? pc.dim(` (${p.reviewCount.toLocaleString()} reviews)`) : ''}`);
  lines.push(`  ${pc.dim('Prime:')}    ${p.isPrime ? pc.blue('Yes') : pc.dim('No')}`);
  lines.push(`  ${pc.dim('URL:')}      ${pc.dim(p.url)}`);
  lines.push('');
  return lines.join('\n');
}

export function formatCart(items: CartItem[], subtotal: number | null): string {
  if (items.length === 0) return pc.dim('\n  Your cart is empty.\n');

  const lines: string[] = [];
  lines.push('');
  lines.push(pc.bold(`  ${'ASIN'.padEnd(14)}${'Qty'.padEnd(6)}${'Price'.padEnd(12)}Title`));
  lines.push(pc.dim(`  ${'─'.repeat(80)}`));

  for (const item of items) {
    const asin = pc.cyan(item.asin.padEnd(14));
    const qty = pc.dim(String(item.quantity).padEnd(6));
    const price = item.price ? pc.green(`$${item.price.toFixed(2)}`.padEnd(12)) : pc.dim('N/A'.padEnd(12));
    const title = item.title.length > 50 ? item.title.slice(0, 47) + '...' : item.title;
    lines.push(`  ${asin}${qty}${price}${title}`);
  }

  lines.push(pc.dim(`  ${'─'.repeat(80)}`));
  if (subtotal !== null) {
    lines.push(pc.bold(`  Subtotal: ${pc.green(`$${subtotal.toFixed(2)}`)}`));
  }
  lines.push('');
  return lines.join('\n');
}

export function formatOrders(orders: Order[]): string {
  if (orders.length === 0) return pc.dim('\n  No orders found.\n');

  const lines: string[] = [];
  lines.push('');

  for (const order of orders) {
    lines.push(pc.bold(`  Order ${pc.cyan(order.orderId)}`));
    lines.push(`  ${pc.dim('Date:')}   ${order.date}`);
    lines.push(`  ${pc.dim('Total:')}  ${order.total ? pc.green(`$${order.total.toFixed(2)}`) : pc.dim('N/A')}`);
    lines.push(`  ${pc.dim('Status:')} ${order.status}`);
    if (order.estimatedDelivery) {
      lines.push(`  ${pc.dim('ETA:')}    ${pc.cyan(order.estimatedDelivery)}`);
    }
    if (order.trackingUrl) {
      lines.push(`  ${pc.dim('Track:')}  ${pc.dim(order.trackingUrl)}`);
    }
    if (order.items.length > 0) {
      lines.push(`  ${pc.dim('Items:')}`);
      for (const item of order.items) {
        const title = item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title;
        lines.push(`    - ${title}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatStaples(staples: Staple[]): string {
  if (staples.length === 0) return pc.dim('\n  No staples saved. Use `amz staples add` to add items.\n');

  const categories = [...new Set(staples.map((s) => s.category))];
  const lines: string[] = [];
  lines.push('');

  for (const cat of categories) {
    lines.push(pc.bold(`  ${cat}`));
    const catItems = staples.filter((s) => s.category === cat);
    for (const item of catItems) {
      const asin = pc.cyan(item.asin);
      const qty = pc.dim(`x${item.quantity}`);
      const title = item.title.length > 50 ? item.title.slice(0, 47) + '...' : item.title;
      lines.push(`    ${asin} ${qty}  ${title}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
