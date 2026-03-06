import type { Page } from 'playwright';
import { GroceryPage } from '../pages/grocery.page.js';
import { humanDelay } from '../browser/humanize.js';

export interface AddressInfo {
  lines: string[];
  isDefault: boolean;
}

export async function listAddresses(page: Page): Promise<AddressInfo[]> {
  await page.goto('https://www.amazon.com/a/addresses', { waitUntil: 'domcontentloaded' });
  await humanDelay(1000, 2000);

  const cards = page.locator('#ya-myab-display-address-block .address-column');
  const count = await cards.count();
  const addressData: AddressInfo[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const card = cards.nth(i);
      const lines = card.locator('ul li, .a-row');
      const lineCount = await lines.count();

      const addressLines: string[] = [];
      for (let j = 0; j < lineCount; j++) {
        const text = await lines.nth(j).textContent({ timeout: 1000 }).catch(() => null);
        if (text && text.trim()) addressLines.push(text.trim());
      }

      if (addressLines.length === 0) continue;

      const isDefault = (await card.locator('.a-badge, span:has-text("Default")').count()) > 0;
      addressData.push({ lines: addressLines, isDefault });
    } catch {
      continue;
    }
  }

  return addressData;
}

export async function setAddress(page: Page, query: string): Promise<boolean> {
  const groceryPage = new GroceryPage(page);
  return groceryPage.setAddress(query);
}
