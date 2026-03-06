import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { GroceryPage } from '../pages/grocery.page.js';
import { SELECTORS } from '../selectors/index.js';
import { humanDelay } from '../browser/humanize.js';

export async function addressListCommand(opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    console.log(pc.dim('\n  Loading addresses...\n'));

    await page.goto('https://www.amazon.com/a/addresses', { waitUntil: 'domcontentloaded' });
    await humanDelay(1000, 2000);

    const cards = page.locator('#ya-myab-display-address-block .address-column');
    const count = await cards.count();

    if (count === 0) {
      console.log(pc.yellow('  No saved addresses found.\n'));
      return;
    }

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
        const label = isDefault ? pc.green(' (default)') : '';

        console.log(pc.bold(`  ${i + 1}. ${addressLines[0]}${label}`));
        for (const line of addressLines.slice(1)) {
          console.log(pc.dim(`     ${line}`));
        }
        console.log('');
      } catch {
        continue;
      }
    }
  });
}

export async function addressSetCommand(query: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const groceryPage = new GroceryPage(page);

    console.log(pc.dim(`\n  Setting delivery address to "${query}"...\n`));
    const success = await groceryPage.setAddress(query);

    if (success) {
      console.log(pc.green(`  Delivery address updated!\n`));
    } else {
      console.log(pc.yellow(`  Could not find address matching "${query}". Use \`amz address list\` to see saved addresses.\n`));
    }
  });
}
