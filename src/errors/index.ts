import pc from 'picocolors';

export class AmzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmzError';
  }
}

export class AuthRequiredError extends AmzError {
  constructor(message = 'Amazon login required. Run `amz login` first.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export class SelectorBreakageError extends AmzError {
  constructor(selectorName: string) {
    super(`Selector "${selectorName}" failed - Amazon may have changed their page layout. Try updating selectors.`);
    this.name = 'SelectorBreakageError';
  }
}

export class CaptchaDetectedError extends AmzError {
  constructor() {
    super('CAPTCHA detected. Please solve it in the browser window.');
    this.name = 'CaptchaDetectedError';
  }
}

export class BotDetectionError extends AmzError {
  constructor() {
    super('Bot detection triggered. Try again later or run `amz login` to refresh session.');
    this.name = 'BotDetectionError';
  }
}

export class ItemUnavailableError extends AmzError {
  constructor(asin: string) {
    super(`Item ${asin} is currently unavailable.`);
    this.name = 'ItemUnavailableError';
  }
}

export class NavigationError extends AmzError {
  constructor(url: string, reason?: string) {
    super(`Failed to navigate to ${url}${reason ? ': ' + reason : ''}`);
    this.name = 'NavigationError';
  }
}

export function handleError(err: unknown): never {
  if (err instanceof AuthRequiredError) {
    console.error(pc.yellow(`\n  ${err.message}\n`));
    process.exit(1);
  }
  if (err instanceof CaptchaDetectedError || err instanceof BotDetectionError) {
    console.error(pc.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
  if (err instanceof SelectorBreakageError) {
    console.error(pc.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
  if (err instanceof AmzError) {
    console.error(pc.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
  if (err instanceof Error) {
    console.error(pc.red(`\n  Unexpected error: ${err.message}\n`));
    if (process.env.AMZ_DEBUG === '1') {
      console.error(err.stack);
    }
    process.exit(1);
  }
  console.error(pc.red('\n  Unknown error occurred.\n'));
  process.exit(1);
}
