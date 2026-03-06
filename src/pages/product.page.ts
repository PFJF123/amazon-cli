import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { Product } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';
import { ItemUnavailableError } from '../errors/index.js';

export class ProductPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async getProduct(asin: string): Promise<Product> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(500, 1500);

    const title = await this.getText(SELECTORS.product.title);
    if (!title) throw new ItemUnavailableError(asin);

    const priceText = await this.getText(SELECTORS.product.price, 3000);
    const ratingText = await this.getText(SELECTORS.product.rating, 3000);
    const reviewText = await this.getText(SELECTORS.product.reviewCount, 3000);
    const imgLoc = await this.tryFindFirst(SELECTORS.product.productImage, 3000);
    const imageUrl = imgLoc ? await imgLoc.getAttribute('src') : null;
    const isPrime = !!(await this.tryFindFirst(SELECTORS.product.primeBadge, 2000));

    return {
      asin,
      title,
      price: this.parsePrice(priceText),
      rating: ratingText ? parseFloat(ratingText.split(' ')[0]) : null,
      reviewCount: reviewText ? parseInt(reviewText.replace(/[^0-9]/g, '')) || null : null,
      isPrime,
      imageUrl,
      url: `https://www.amazon.com/dp/${asin}`,
    };
  }

  async addToCart(asin: string, quantity = 1): Promise<boolean> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(500, 1000);

    if (quantity > 1) {
      const qtySelect = await this.tryFindFirst(SELECTORS.product.quantity, 3000);
      if (qtySelect) {
        await qtySelect.selectOption(String(quantity));
        await humanDelay(300, 600);
      }
    }

    const addBtn = await this.tryFindFirst(SELECTORS.product.addToCartButton, 5000);
    if (!addBtn) throw new ItemUnavailableError(asin);

    await addBtn.click();
    await humanDelay(1500, 3000);
    return true;
  }
}
