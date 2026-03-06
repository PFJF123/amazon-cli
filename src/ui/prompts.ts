import * as clack from '@clack/prompts';
import pc from 'picocolors';
import type { Product, Staple } from '../models/product.js';

export async function confirmAction(message: string): Promise<boolean> {
  const result = await clack.confirm({ message });
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result;
}

export async function selectProducts(products: Product[]): Promise<Product[]> {
  const result = await clack.multiselect({
    message: 'Select products to add to cart:',
    options: products.map((p) => ({
      value: p,
      label: `${p.title.slice(0, 50)}${p.title.length > 50 ? '...' : ''}`,
      hint: p.price ? `$${p.price.toFixed(2)} - ${p.asin}` : p.asin,
    })),
  });

  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result;
}

export async function selectStaples(staples: Staple[]): Promise<Staple[]> {
  const result = await clack.multiselect({
    message: 'Select staples to order:',
    options: staples.map((s) => ({
      value: s,
      label: `${s.title.slice(0, 50)}${s.title.length > 50 ? '...' : ''}`,
      hint: `x${s.quantity} - ${s.category}`,
    })),
  });

  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result;
}

export async function inputStaple(): Promise<{ asin: string; quantity: number; category: string }> {
  const asin = await clack.text({
    message: 'Product ASIN:',
    validate: (v) => (v.length < 5 ? 'Enter a valid ASIN' : undefined),
  });
  if (clack.isCancel(asin)) process.exit(0);

  const quantity = await clack.text({
    message: 'Quantity:',
    initialValue: '1',
    validate: (v) => (isNaN(parseInt(v)) || parseInt(v) < 1 ? 'Enter a valid number' : undefined),
  });
  if (clack.isCancel(quantity)) process.exit(0);

  const category = await clack.text({
    message: 'Category (e.g., Household, Food, Personal Care):',
    validate: (v) => (v.length < 1 ? 'Enter a category' : undefined),
  });
  if (clack.isCancel(category)) process.exit(0);

  return { asin: asin as string, quantity: parseInt(quantity as string), category: category as string };
}
