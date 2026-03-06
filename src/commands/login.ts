import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { LoginPage } from '../pages/login.page.js';

export async function loginCommand(opts: SessionOptions): Promise<void> {
  await withSession({ ...opts, headless: false }, async (page) => {
    const loginPage = new LoginPage(page);

    const isLoggedIn = await loginPage.ensureLoggedIn();
    if (isLoggedIn) {
      console.log(pc.green('\n  Already logged in to Amazon.\n'));
      return;
    }

    await loginPage.navigateToLogin();
    const success = await loginPage.waitForManualLogin();

    if (success) {
      console.log(pc.green('\n  Successfully logged in! Session saved.\n'));
    } else {
      console.log(pc.red('\n  Login timed out. Please try again.\n'));
    }
  });
}
