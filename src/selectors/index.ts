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
    resultTitle: ['h2 span.a-text-normal', 'h2 span', 'h2 a span', '.a-size-base-plus.a-text-normal'] as SelectorChain,
    resultLink: ['h2 a.a-link-normal', 'h2 a'] as SelectorChain,
    resultPrice: ['.a-price > .a-offscreen', '.a-price span[aria-hidden="true"]', '.a-color-price'] as SelectorChain,
    resultRating: ['span.a-icon-alt', 'i.a-icon-star-small span.a-icon-alt'] as SelectorChain,
    resultReviewCount: ['a[href*="customerReviews"] span', 'span.a-size-base.s-underline-text'] as SelectorChain,
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

  // Grocery checkout (Whole Foods / Amazon Fresh)
  groceryCheckout: {
    checkoutButton: ['input[name="proceedToALMCheckout"]', '#sc-alm-buy-box .a-button-primary input', '#alm-byg-checkout-button input'] as SelectorChain,
    deliveryWindowContainer: ['#delivery-slot-form', '.ss-delivery-window', '#slot-container'] as SelectorChain,
    deliveryDayTabs: ['.ufss-date-select-toggle', '.ss-carousel-item', '.delivery-date-tab'] as SelectorChain,
    deliveryDayLabel: ['.ufss-date-select-toggle-text-container', '.date-text', 'span'] as SelectorChain,
    deliveryTimeSlots: ['.ufss-slot', '.ss-delivery-slot', '.delivery-time-slot'] as SelectorChain,
    deliveryTimeLabel: ['.ufss-slot-time-window-text', '.slot-time-text', 'span'] as SelectorChain,
    deliveryTimeCost: ['.ufss-slot-price-text', '.slot-price'] as SelectorChain,
    selectedSlot: ['.ufss-slot.ufss-selected', '.ss-delivery-slot.selected'] as SelectorChain,
    continueButton: ['input[name="continue-bottom"]', 'input[name="continue-top"]', '.a-button-primary input[type="submit"]'] as SelectorChain,
    tipSection: ['#tip-section', '.tip-amount-container'] as SelectorChain,
    tipOptions: ['input[name="tip"]', '.tip-amount-option input'] as SelectorChain,
    placeOrderButton: ['input[name="placeYourOrder1"]', '#place-order-button input', '#submitOrderButtonId input'] as SelectorChain,
    orderTotal: ['.grand-total-price', '.order-summary-total .a-color-price', '#subtotals-marketplace-table .a-text-right'] as SelectorChain,
    confirmationPage: ['#thankyou-container', '.a-box.order-confirm', 'h4:has-text("Order placed")'] as SelectorChain,
    substitutePrefs: ['input[name="substitution"]', '#substitution-preference'] as SelectorChain,
  },

  // Orders
  orders: {
    orderCards: ['.order-card', '.js-order-card', '.a-box-group.order'] as SelectorChain,
    orderDate: ['.order-header .a-size-base.a-color-secondary.aok-break-word', '.order-info span.value'] as SelectorChain,
    orderTotal: ['.order-header .a-column.a-span2 .a-size-base.a-color-secondary', '.yohtmlc-order-total .value'] as SelectorChain,
    orderId: ['span[dir="ltr"]', '.yohtmlc-order-id .value'] as SelectorChain,
    orderStatus: ['.delivery-box__primary-text', 'span.a-size-medium.a-color-success', '.shipment-status-content'] as SelectorChain,
    orderItemTitle: ['.yohtmlc-product-title', 'a[href*="/dp/"]'] as SelectorChain,
    orderItemLink: ['.yohtmlc-product-title a', 'a[href*="/dp/"]'] as SelectorChain,
    timeFilter: ['#time-filter', 'select#time-filter', '#orderFilter'] as SelectorChain,
    headerValues: ['.order-header .a-size-base.a-color-secondary.aok-break-word'] as SelectorChain,
    trackingLink: ['a[href*="track"]', 'a:has-text("Track package")'] as SelectorChain,
    estimatedDelivery: ['.delivery-box__primary-text', 'span.a-size-medium.a-color-success'] as SelectorChain,
    detailDate: ['.order-date-invoice-item span.a-color-secondary', '.order-info .value'] as SelectorChain,
    detailTotal: ['#od-subtotals .a-text-right .a-color-base', '.order-summary-total .a-color-price'] as SelectorChain,
    detailDeliveryEta: ['#primaryDeliveryCountdown', '.delivery-box__primary-text', 'span:has-text("Arriving")'] as SelectorChain,
    productLinks: ['a[href*="/dp/"]', 'a[href*="/gp/product/"]'] as SelectorChain,
  },

  // Grocery (Whole Foods / Amazon Fresh)
  grocery: {
    freshAddToCart: ['#freshAddToCartButton', 'button:has-text("Add to Cart")', '#add-to-cart-button'] as SelectorChain,
    categoryLinks: ['a[href*="almBrandId"][href*="node"]'] as SelectorChain,
    locationText: ['span.nav-line-2#glow-ingress-line2', '#glow-ingress-line2'] as SelectorChain,
    freshUnavailable: ['.alm-location-alert', 'span:has-text("not available")'] as SelectorChain,
    perUnitPrice: ['.a-price-per-unit', 'span:has-text("/oz")', 'span:has-text("/lb")', 'span:has-text("/ct")'] as SelectorChain,
    locationPopover: ['#nav-global-location-popover-link', '#glow-ingress-block'] as SelectorChain,
    addressList: ['#GLUXAddressList li'] as SelectorChain,
    addressSubmitButton: ['input[type="submit"].a-button-input'] as SelectorChain,
    deliveryTab: ['[role="tab"]:has-text("Delivery")', '.a-tab-heading:has-text("Delivery")'] as SelectorChain,
    pickupTab: ['[role="tab"]:has-text("Pickup")', '.a-tab-heading:has-text("Pickup")'] as SelectorChain,
    deliveryMessage: ['#alm-delivery-message', '#almLogoAndDeliveryMessage_feature_div'] as SelectorChain,
  },
  // Subscribe & Save
  subscribeAndSave: {
    snsBadge: ['#snsDetailPageTrigger', '#sns-base-price', '.sns-content'] as SelectorChain,
    snsCheckbox: ['#snsDetailPageTrigger input[type="checkbox"]', '#snsPriceBlock input'] as SelectorChain,
    snsFrequencySelect: ['#deliveryScheduleSelect', '#sns-frequency'] as SelectorChain,
    snsPrice: ['#sns-base-price .a-offscreen', '#snsPriceBlock .a-offscreen'] as SelectorChain,
    snsSubscriptionsPage: ['.subscription-item', '.sns-dashboard-row'] as SelectorChain,
    snsItemTitle: ['.subscription-title', '.sns-item-title'] as SelectorChain,
    snsItemFrequency: ['.subscription-frequency', '.sns-frequency-text'] as SelectorChain,
    snsItemNextDelivery: ['.subscription-next-delivery', '.sns-next-delivery-text'] as SelectorChain,
    snsItemPrice: ['.subscription-price', '.sns-item-price'] as SelectorChain,
    snsSkipButton: ['input[name="skipNext"]', 'button:has-text("Skip")'] as SelectorChain,
    snsCancelButton: ['input[name="cancel"]', 'a:has-text("Cancel subscription")'] as SelectorChain,
  },

  // Address management
  address: {
    addressBook: ['#ya-myab-display-address-block', '.address-section'] as SelectorChain,
    addressCard: ['.address-column'] as SelectorChain,
    addressName: ['.address-column .a-row:first-child .a-text-bold', 'li.a-spacing-none:first-child'] as SelectorChain,
    addressLines: ['.address-column ul li', '.address-column .a-row'] as SelectorChain,
    defaultBadge: ['.address-column .a-badge', 'span:has-text("Default")'] as SelectorChain,
  },
} as const;
