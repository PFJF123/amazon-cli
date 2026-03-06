import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import pc from 'picocolors';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin(): Promise<void> {
    await this.navigateTo('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');
  }

  async waitForManualLogin(timeoutMs = 300000): Promise<boolean> {
    console.log(pc.cyan('\n  Please log in to Amazon in the browser window.'));
    console.log(pc.dim('  Complete 2FA if prompted. This will wait up to 5 minutes.\n'));

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((r) => setTimeout(r, 2000));

      const url = this.page.url();
      if (url.includes('amazon.com') && !url.includes('/ap/signin') && !url.includes('/ap/mfa')) {
        if (await this.isAuthenticated()) {
          return true;
        }
      }
    }
    return false;
  }

  async ensureLoggedIn(): Promise<boolean> {
    await this.navigateTo('https://www.amazon.com');
    return this.isAuthenticated();
  }
}
