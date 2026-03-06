import type { Page } from 'playwright';
import { GroceryPage, type GroceryStore, type FulfillmentMode, type GroceryCategory, type DeliveryInfo } from '../pages/grocery.page.js';
import type { Product } from '../models/product.js';

export async function grocerySearch(page: Page, query: string, store: GroceryStore = 'wholefoods', limit = 10): Promise<Product[]> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.search(query, store, limit);
}

export async function groceryCategories(page: Page, store: GroceryStore = 'wholefoods'): Promise<GroceryCategory[]> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.getCategories(store);
}

export async function groceryBrowse(page: Page, categoryUrl: string, limit = 10): Promise<Product[]> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.browseCategory(categoryUrl, limit);
}

export async function groceryAdd(page: Page, asin: string, quantity = 1, mode: FulfillmentMode = 'delivery'): Promise<boolean> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.addToCart(asin, quantity, mode);
}

export async function grocerySetAddress(page: Page, query: string): Promise<boolean> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.setAddress(query);
}

export async function groceryInfo(page: Page, asin: string): Promise<DeliveryInfo> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.getDeliveryInfo(asin);
}
