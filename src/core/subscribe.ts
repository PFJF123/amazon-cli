import type { Page } from 'playwright';
import { SubscribePage, type Subscription, type SnsProductInfo } from '../pages/subscribe.page.js';

export async function listSubscriptions(page: Page): Promise<Subscription[]> {
  const subscribePage = new SubscribePage(page);
  return subscribePage.listSubscriptions();
}

export async function subscribeInfo(page: Page, asin: string): Promise<SnsProductInfo> {
  const subscribePage = new SubscribePage(page);
  return subscribePage.getProductSnsInfo(asin);
}

export async function subscribeAdd(page: Page, asin: string, frequencyIndex = 0): Promise<boolean> {
  const subscribePage = new SubscribePage(page);
  return subscribePage.subscribeToProduct(asin, frequencyIndex);
}
