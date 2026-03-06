import type { Page } from 'playwright';
import { CartPage, type CartContents } from '../pages/cart.page.js';

export async function listCart(page: Page): Promise<CartContents> {
  const cartPage = new CartPage(page);
  return cartPage.listItems();
}

export async function removeFromCart(page: Page, asin: string): Promise<boolean> {
  const cartPage = new CartPage(page);
  return cartPage.removeItem(asin);
}

export async function updateCartQty(page: Page, asin: string, quantity: number): Promise<boolean> {
  const cartPage = new CartPage(page);
  return cartPage.updateQuantity(asin, quantity);
}

export async function clearCart(page: Page): Promise<number> {
  const cartPage = new CartPage(page);
  return cartPage.clearCart();
}
