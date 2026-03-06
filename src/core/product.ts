import type { Page } from 'playwright';
import { ProductPage } from '../pages/product.page.js';
import type { Product } from '../models/product.js';

export async function getProduct(page: Page, asin: string): Promise<Product> {
  const productPage = new ProductPage(page);
  return productPage.getProduct(asin);
}

export async function addToCart(page: Page, asin: string, quantity = 1): Promise<boolean> {
  const productPage = new ProductPage(page);
  return productPage.addToCart(asin, quantity);
}
