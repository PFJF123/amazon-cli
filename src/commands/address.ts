import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { AddressPage } from '../pages/address.page.js';

export async function addressListCommand(opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    console.log(pc.dim('\n  Loading addresses...\n'));

    const addressPage = new AddressPage(page);
    const addresses = await addressPage.listAddresses();

    if (addresses.length === 0) {
      console.log(pc.yellow('  No saved addresses found.\n'));
      return;
    }

    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      const label = addr.isDefault ? pc.green(' (default)') : '';

      console.log(pc.bold(`  ${i + 1}. ${addr.lines[0]}${label}`));
      for (const line of addr.lines.slice(1)) {
        console.log(pc.dim(`     ${line}`));
      }
      console.log('');
    }
  });
}

export async function addressSetCommand(query: string, opts: SessionOptions): Promise<void> {
  await withSession(opts, async (page) => {
    const addressPage = new AddressPage(page);

    console.log(pc.dim(`\n  Setting delivery address to "${query}"...\n`));
    const success = await addressPage.setAddress(query);

    if (success) {
      console.log(pc.green(`  Delivery address updated!\n`));
    } else {
      console.log(pc.yellow(`  Could not find address matching "${query}". Use \`amz address list\` to see saved addresses.\n`));
    }
  });
}
