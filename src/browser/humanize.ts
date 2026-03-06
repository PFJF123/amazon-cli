import type { Page } from 'playwright';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function humanDelay(minMs = 500, maxMs = 2000): Promise<void> {
  await new Promise((r) => setTimeout(r, randomBetween(minMs, maxMs)));
}

export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await humanDelay(200, 500);
  for (const char of text) {
    await page.keyboard.type(char, { delay: randomBetween(50, 150) });
  }
}

export async function humanClick(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  await el.hover();
  await humanDelay(100, 300);
  await el.click();
}

export async function humanScroll(page: Page, distance = 300): Promise<void> {
  await page.mouse.wheel(0, randomBetween(distance / 2, distance));
  await humanDelay(300, 800);
}
