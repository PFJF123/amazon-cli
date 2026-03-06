import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { SubscribePage } from '../pages/subscribe.page.js';

export async function subscribeListCommand(opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const subscribePage = new SubscribePage(page);

    console.log(pc.dim('\n  Loading subscriptions...\n'));
    const subscriptions = await subscribePage.listSubscriptions();

    if (subscriptions.length === 0) {
      console.log(pc.dim('  No active Subscribe & Save subscriptions.\n'));
      return;
    }

    console.log(pc.bold('  Subscribe & Save\n'));
    for (const sub of subscriptions) {
      const title = sub.title.length > 55 ? sub.title.slice(0, 52) + '...' : sub.title;
      console.log(pc.bold(`  ${sub.index + 1}. ${title}`));
      if (sub.frequency) console.log(`     ${pc.dim('Frequency:')} ${sub.frequency}`);
      if (sub.nextDelivery) console.log(`     ${pc.dim('Next:')}      ${pc.cyan(sub.nextDelivery)}`);
      if (sub.price) console.log(`     ${pc.dim('Price:')}     ${pc.green(sub.price)}`);
      console.log('');
    }
  });
}

export async function subscribeInfoCommand(asin: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const subscribePage = new SubscribePage(page);

    console.log(pc.dim(`\n  Checking Subscribe & Save for ${asin}...\n`));
    const info = await subscribePage.getProductSnsInfo(asin);

    if (!info.available) {
      console.log(pc.yellow('  Subscribe & Save is not available for this product.\n'));
      return;
    }

    console.log(`  ${pc.dim('S&S Price:')} ${info.price ? pc.green(info.price) : pc.dim('N/A')}`);
    if (info.frequencies.length > 0) {
      console.log(`  ${pc.dim('Frequencies:')}`);
      for (let i = 0; i < info.frequencies.length; i++) {
        console.log(`    ${i + 1}. ${info.frequencies[i]}`);
      }
    }
    console.log('');
  });
}

export async function subscribeAddCommand(asin: string, opts: SessionOptions & { frequency?: number }): Promise<void> {
  await withSession(opts, async (page) => {
    const subscribePage = new SubscribePage(page);
    const frequencyIndex = (opts.frequency ?? 1) - 1; // CLI uses 1-based

    console.log(pc.dim(`\n  Subscribing to ${asin}...\n`));
    const success = await subscribePage.subscribeToProduct(asin, frequencyIndex);

    if (success) {
      console.log(pc.green('  Subscribed and added to cart!\n'));
    } else {
      console.log(pc.yellow('  Could not subscribe. Product may not support Subscribe & Save.\n'));
    }
  });
}
