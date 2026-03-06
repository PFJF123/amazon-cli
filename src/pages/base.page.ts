import type { Page, Locator } from 'playwright';
import pc from 'picocolors';
import type { SelectorChain } from '../selectors/index.js';
import { SELECTORS } from '../selectors/index.js';
import { SelectorBreakageError, AuthRequiredError } from '../errors/index.js';
import { humanDelay } from '../browser/humanize.js';

const CAPTCHA_WAIT_TIMEOUT = 120000; // 2 minutes to solve captcha

export class BasePage {
  constructor(protected page: Page) {}

  async findFirst(chain: SelectorChain, timeout = 5000): Promise<Locator> {
    for (const selector of chain) {
      try {
        const loc = this.page.locator(selector).first();
        await loc.waitFor({ state: 'attached', timeout });
        return loc;
      } catch {
        continue;
      }
    }
    throw new SelectorBreakageError(chain[0]);
  }

  async tryFindFirst(chain: SelectorChain, timeout = 3000): Promise<Locator | null> {
    for (const selector of chain) {
      try {
        const loc = this.page.locator(selector).first();
        await loc.waitFor({ state: 'attached', timeout });
        return loc;
      } catch {
        continue;
      }
    }
    return null;
  }

  async findAll(chain: SelectorChain, timeout = 5000): Promise<Locator[]> {
    for (const selector of chain) {
      try {
        await this.page.locator(selector).first().waitFor({ state: 'attached', timeout });
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          const locators: Locator[] = [];
          for (let i = 0; i < count; i++) {
            locators.push(this.page.locator(selector).nth(i));
          }
          return locators;
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  async getText(chain: SelectorChain, timeout = 5000): Promise<string | null> {
    const loc = await this.tryFindFirst(chain, timeout);
    if (!loc) return null;
    return (await loc.textContent())?.trim() ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const greeting = await this.getText(SELECTORS.auth.signedInGreeting, 3000);
      if (greeting && !greeting.toLowerCase().includes('sign in')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async checkAuth(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      throw new AuthRequiredError();
    }
  }

  private isCaptchaPage(): boolean {
    const url = this.page.url();
    return url.includes('validateCaptcha') || url.includes('/errors/validateCaptcha');
  }

  private async hasCaptchaElement(): Promise<boolean> {
    const captcha = await this.tryFindFirst(SELECTORS.botDetection.captchaPage, 1000);
    return !!captcha;
  }

  async waitForCaptchaResolution(): Promise<void> {
    if (!this.isCaptchaPage() && !(await this.hasCaptchaElement())) return;

    console.log(pc.yellow('\n  CAPTCHA detected. Please solve it in the browser window.'));
    console.log(pc.dim('  Waiting up to 2 minutes...\n'));

    const start = Date.now();
    while (Date.now() - start < CAPTCHA_WAIT_TIMEOUT) {
      await new Promise((r) => setTimeout(r, 2000));

      // Check if we've moved past the captcha page
      if (!this.isCaptchaPage() && !(await this.hasCaptchaElement())) {
        console.log(pc.green('  CAPTCHA solved. Continuing...\n'));
        await humanDelay(500, 1000);
        return;
      }
    }

    throw new Error('CAPTCHA was not solved within 2 minutes. Please try again.');
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await humanDelay(500, 1500);
    await this.waitForCaptchaResolution();
    // Detect unexpected session expiry redirects
    if (!url.includes('/ap/signin') && this.page.url().includes('/ap/signin')) {
      throw new AuthRequiredError('Session expired. Run `amz login` to re-authenticate.');
    }
  }

  parsePrice(text: string | null): number | null {
    if (!text) return null;
    const match = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(match);
    return isNaN(num) ? null : num;
  }
}
