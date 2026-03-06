import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { Product } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

export interface SearchOptions {
  sort?: string;
  prime?: boolean;
  maxPrice?: number;
  limit?: number;
}

export class SearchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async search(query: string, opts: SearchOptions = {}): Promise<Product[]> {
    let url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
    const rhParts: string[] = [];
    if (opts.prime) rhParts.push('p_85%3A2470955011');
    if (opts.maxPrice) rhParts.push(`p_36%3A-${opts.maxPrice * 100}`);
    if (rhParts.length > 0) url += `&rh=${rhParts.join('%2C')}`;
    if (opts.sort) {
      const sortMap: Record<string, string> = {
        'price-asc': 'price-asc-rank',
        'price-desc': 'price-desc-rank',
        'rating': 'review-rank',
        'newest': 'date-desc-rank',
        'best-seller': 'exact-aware-popularity-rank',
      };
      url += `&s=${sortMap[opts.sort] || opts.sort}`;
    }

    await this.navigateTo(url);
    await humanDelay(1000, 2000);

    const limit = opts.limit ?? 10;
    return this.parseSearchResults(limit);
  }

  protected async parseSearchResults(limit: number): Promise<Product[]> {
    const items = await this.findAll(SELECTORS.search.resultItems, 8000);
    const products: Product[] = [];

    for (const item of items.slice(0, limit + 5)) {
      if (products.length >= limit) break;

      try {
        const asin = await item.getAttribute('data-asin');
        if (!asin || asin === '') continue;

        const title = await this.getChildText(item, SELECTORS.search.resultTitle);
        if (!title) continue;

        const priceText = await this.getChildText(item, SELECTORS.search.resultPrice);
        const ratingText = await this.getChildText(item, SELECTORS.search.resultRating);
        const reviewText = await this.getChildText(item, SELECTORS.search.resultReviewCount);
        const imageUrl = await this.getChildAttr(item, SELECTORS.search.resultImage, 'src');
        const isPrime = await this.hasChildMatch(item, SELECTORS.search.resultPrimeBadge);

        products.push({
          asin,
          title: title.trim(),
          price: this.parsePrice(priceText),
          rating: ratingText ? parseFloat(ratingText.split(' ')[0]) : null,
          reviewCount: reviewText ? parseInt(reviewText.replace(/[^0-9]/g, '')) || null : null,
          isPrime,
          imageUrl,
          url: `https://www.amazon.com/dp/${asin}`,
        });
      } catch {
        continue;
      }
    }

    return products;
  }
}
