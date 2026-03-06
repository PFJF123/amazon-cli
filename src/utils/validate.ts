import { AmzError } from '../errors/index.js';

export function validateAsin(asin: string): void {
  if (!/^[A-Z0-9]{10}$/i.test(asin)) {
    throw new AmzError(`Invalid ASIN "${asin}". ASINs must be exactly 10 alphanumeric characters.`);
  }
}
