import pc from 'picocolors';
import { getPage, closeSession, type SessionOptions } from '../browser/session.js';
import { LoginPage } from '../pages/login.page.js';

export async function loginCommand(opts: SessionOptions): Promise<void> {
  const page = await getPage({ ...opts, headless: false }); // login always headed
  const loginPage = new LoginPage(page);

  const isLoggedIn = await loginPage.ensureLoggedIn();
  if (isLoggedIn) {
    console.log(pc.green('\n  Already logged in to Amazon.\n'));
    await closeSession();
    return;
  }

  await loginPage.navigateToLogin();
  const success = await loginPage.waitForManualLogin();

  if (success) {
    console.log(pc.green('\n  Successfully logged in! Session saved.\n'));
  } else {
    console.log(pc.red('\n  Login timed out. Please try again.\n'));
  }

  await closeSession();
}
