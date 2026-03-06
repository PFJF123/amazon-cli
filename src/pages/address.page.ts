import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import { humanDelay } from '../browser/humanize.js';

export interface SavedAddress {
  lines: string[];
  isDefault: boolean;
}

export class AddressPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async listAddresses(): Promise<SavedAddress[]> {
    await this.navigateTo('https://www.amazon.com/a/addresses');
    await humanDelay(1000, 2000);

    const cards = await this.findAll(SELECTORS.address.addressCard, 5000);
    const addresses: SavedAddress[] = [];

    for (const card of cards) {
      try {
        const lineElements = card.locator(SELECTORS.address.addressLines.join(', '));
        const lineCount = await lineElements.count();

        const lines: string[] = [];
        for (let j = 0; j < lineCount; j++) {
          const text = await lineElements.nth(j).textContent({ timeout: 1000 }).catch(() => null);
          if (text && text.trim()) lines.push(text.trim());
        }

        if (lines.length === 0) continue;

        const isDefault = await this.hasChildMatch(card, SELECTORS.address.defaultBadge);
        addresses.push({ lines, isDefault });
      } catch {
        continue;
      }
    }

    return addresses;
  }

  async setAddress(addressQuery: string): Promise<boolean> {
    await this.navigateTo('https://www.amazon.com');
    await humanDelay(500, 1000);

    // Open location popover
    const locBtn = await this.findFirst(SELECTORS.grocery.locationPopover);
    await locBtn.click();
    await humanDelay(1500, 2500);

    // Find the matching address
    const addressItems = this.page.locator(SELECTORS.grocery.addressList[0]);
    const count = await addressItems.count();

    for (let i = 0; i < count; i++) {
      const text = await addressItems.nth(i).textContent().catch(() => null);
      if (text && text.toLowerCase().includes(addressQuery.toLowerCase())) {
        const submitBtn = addressItems.nth(i).locator(SELECTORS.grocery.addressSubmitButton[0]).first();
        if ((await submitBtn.count()) > 0) {
          await submitBtn.click({ force: true });
          await humanDelay(3000, 5000);

          const newLocation = await this.getText(SELECTORS.grocery.locationText, 3000);
          return newLocation !== null;
        }
      }
    }

    return false;
  }
}
