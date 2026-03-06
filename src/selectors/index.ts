export type SelectorChain = string[];

// Each chain is tried in order until one matches.
// First entry is the most current/reliable selector.

export const SELECTORS = {
  // Auth detection
  auth: {
    signInLink: ['#nav-link-accountList', 'a[data-nav-role="signin"]', '#nav-signin-tooltip a'] as SelectorChain,
    signedInGreeting: ['#nav-link-accountList .nav-line-1', '#nav-link-accountList span.nav-line-1'] as SelectorChain,
    signInPage: ['form[name="signIn"]', '#ap_email', '#signInSubmit'] as SelectorChain,
  },

  // Login page
  login: {
    emailField: ['#ap_email', 'input[name="email"]'] as SelectorChain,
    passwordField: ['#ap_password', 'input[name="password"]'] as SelectorChain,
    submitButton: ['#signInSubmit', 'input[type="submit"]'] as SelectorChain,
    captcha: ['#auth-captcha-image', '#captchacharacters', '.a-row.a-spacing-large img[src*="captcha"]'] as SelectorChain,
  },

  // Bot / CAPTCHA detection
  botDetection: {
    captchaPage: ['form[action*="validateCaptcha"]', '#captchacharacters'] as SelectorChain,
    robotCheck: ['input[id="captchacharacters"]', 'p:has-text("Type the characters")'] as SelectorChain,
  },

  // Search results
  search: {
    searchBox: ['#twotabsearchtextbox', 'input[name="field-keywords"]', '#nav-search-bar-form input[type="text"]'] as SelectorChain,
    searchButton: ['#nav-search-submit-button', 'input[type="submit"][value="Go"]'] as SelectorChain,
    resultItems: ['div[data-component-type="s-search-result"]', '.s-result-item[data-asin]'] as SelectorChain,
    resultTitle: ['h2 a span', 'h2 .a-text-normal', '.a-size-medium.a-color-base.a-text-normal'] as SelectorChain,
    resultLink: ['h2 a.a-link-normal', 'h2 a'] as SelectorChain,
    resultPrice: ['.a-price > .a-offscreen', '.a-price span[aria-hidden="true"]', '.a-color-price'] as SelectorChain,
    resultRating: ['span.a-icon-alt', 'i.a-icon-star-small span.a-icon-alt'] as SelectorChain,
    resultReviewCount: ['span.a-size-base.s-underline-text', 'a[href*="customerReviews"] span'] as SelectorChain,
    resultPrimeBadge: ['i.a-icon-prime', 'span[aria-label="Amazon Prime"]', '.s-prime'] as SelectorChain,
    resultImage: ['img.s-image', '.s-product-image-container img'] as SelectorChain,
    resultAsin: ['[data-asin]'] as SelectorChain,
    sortDropdown: ['#s-result-sort-select', '#sort'] as SelectorChain,
    noResults: ['.a-section .a-spacing-top-large .a-text-center', 'span:has-text("No results for")'] as SelectorChain,
  },

  // Product detail page
  product: {
    title: ['#productTitle', '#title span', 'h1#title'] as SelectorChain,
    price: ['#corePrice_feature_div .a-offscreen', '#priceblock_ourprice', '#price_inside_buybox', 'span.a-price .a-offscreen'] as SelectorChain,
    rating: ['#acrPopover span.a-icon-alt', '#averageCustomerReviews span.a-icon-alt'] as SelectorChain,
    reviewCount: ['#acrCustomerReviewText', '#averageCustomerReviews .a-size-base'] as SelectorChain,
    availability: ['#availability span', '#outOfStock', '#availability_feature_div'] as SelectorChain,
    addToCartButton: ['#add-to-cart-button', '#add-to-cart-button-ubb', 'input[name="submit.add-to-cart"]'] as SelectorChain,
    buyNowButton: ['#buy-now-button', '#submitOrderButtonId input'] as SelectorChain,
    productImage: ['#imgTagWrapperId img', '#landingImage', '#main-image-container img'] as SelectorChain,
    primeBadge: ['#newAccordionRow i.a-icon-prime', '#primeBadge', 'i.a-icon-prime'] as SelectorChain,
    quantity: ['#quantity', 'select#quantity'] as SelectorChain,
  },

  // Cart
  cart: {
    cartCount: ['#nav-cart-count', '#nav-cart-count-container span'] as SelectorChain,
    cartItems: ['div[data-asin].sc-list-item', '.sc-list-item[data-asin]', 'div.sc-item-content-group'] as SelectorChain,
    cartItemTitle: ['.sc-product-title .a-truncate-cut', '.sc-product-title a', 'span.a-truncate-cut'] as SelectorChain,
    cartItemPrice: ['.sc-product-price', '.sc-item-price-block .a-offscreen', 'span.sc-price'] as SelectorChain,
    cartItemQuantity: ['select.sc-quantity-textfield', '.sc-quantity-textfield', 'input[name*="quantity"]'] as SelectorChain,
    cartItemDelete: ['input[value="Delete"]', 'a[value="Delete"]', '.sc-action-delete input'] as SelectorChain,
    cartSubtotal: ['#sc-subtotal-amount-activecart span', '#sc-subtotal-amount-buybox span', '#sc-subtotal-label-activecart'] as SelectorChain,
    proceedToCheckout: ['input[name="proceedToRetailCheckout"]', '#sc-buy-box-ptc-button input', 'a[name="proceedToRetailCheckout"]'] as SelectorChain,
    emptyCart: ['.sc-your-amazon-cart-is-empty', 'h2:has-text("Your Amazon Cart is empty")'] as SelectorChain,
    cartItemImage: ['.sc-product-image img', '.sc-item-image img'] as SelectorChain,
  },

  // Checkout
  checkout: {
    deliveryAddress: ['#delivery-address-display', '.ship-to-this-address'] as SelectorChain,
    deliverySlots: ['.delivery-option', '.shipping-option', '#delivery-slot-form .a-row'] as SelectorChain,
    deliverySlotLabel: ['.delivery-option label', '.shipping-option-content'] as SelectorChain,
    orderTotal: ['#subtotals-marketplace-table .grand-total-price', '.order-summary-total .a-color-price'] as SelectorChain,
    placeOrderButton: ['#submitOrderButtonId input', '#placeYourOrder input', '#submitOrderButtonId-announce'] as SelectorChain,
    orderSummary: ['#order-summary', '.order-summary-container'] as SelectorChain,
    confirmationPage: ['#thankyou-container', '.a-box.order-confirm'] as SelectorChain,
  },

  // Orders
  orders: {
    orderCards: ['.order-card', '.order', '.a-box-group.order'] as SelectorChain,
    orderDate: ['.order-info .a-column .a-color-secondary', '.order-info span.value'] as SelectorChain,
    orderTotal: ['.order-info .a-column:nth-child(2) .value', '.yohtmlc-order-total .value'] as SelectorChain,
    orderId: ['.order-info .a-column:last-child .value', '.yohtmlc-order-id .value'] as SelectorChain,
    orderStatus: ['.delivery-box__primary-text', '.shipment-status-content'] as SelectorChain,
    orderItemTitle: ['.yohtmlc-product-title', '.a-fixed-left-grid-col.a-col-right .a-row a'] as SelectorChain,
    orderItemLink: ['.yohtmlc-product-title a', '.a-link-normal[href*="/gp/product/"]'] as SelectorChain,
    timeFilter: ['#time-filter', '#orderFilter', 'select#time-filter'] as SelectorChain,
  },
} as const;
