// Amazon CLI - Programmatic API
// No side effects on import. All functions accept a Playwright Page.

export { searchProducts } from './core/search.js';
export { getProduct, addToCart } from './core/product.js';
export { listCart, removeFromCart, updateCartQty, clearCart } from './core/cart.js';
export { listOrders, getOrder, trackOrder, reorderItems, cancelOrder, returnOrder } from './core/orders.js';
export { grocerySearch, groceryCategories, groceryBrowse, groceryAdd, grocerySetAddress, groceryInfo } from './core/grocery.js';
export { listSubscriptions, subscribeInfo, subscribeAdd } from './core/subscribe.js';
export { listStaples, addStaple, removeStaple, getCategories, orderStaples, seedStaples, DEFAULT_STAPLES } from './core/staples.js';
export { listAddresses, setAddress } from './core/address.js';
export { loadConfig, saveConfig, setConfigValue, getConfigValue } from './core/config.js';
export { getCheckoutSummary, placeOrder } from './core/checkout.js';

// Session management
export { getPage, getContext, closeSession, withSession } from './browser/session.js';
export type { SessionOptions } from './browser/session.js';

// Types
export type {
  ApiResponse,
  Product, CartItem, DeliverySlot, Order, OrderItem, Staple,
  CartContents, CheckoutSummary, GroceryCategory, DeliveryInfo,
  GroceryStore, FulfillmentMode, Subscription, SnsProductInfo,
  GroceryCheckoutSummary, GroceryDeliveryDay, GroceryDeliverySlot,
  SearchOptions, AmzConfig,
} from './core/types.js';
export type { AddressInfo } from './core/address.js';

// Errors
export { AmzError, AuthRequiredError, SelectorBreakageError, CaptchaDetectedError, BotDetectionError, ItemUnavailableError, NavigationError } from './errors/index.js';
