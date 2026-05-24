import { isValidEmail, isValidPhone } from '../../../helpers/validation';
import type { CartItem, Product, StorefrontCustomer } from '../../../models';

export const storefrontTaxRate = 0.12;

export const emptyStorefrontCustomer: StorefrontCustomer = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: ''
};

export function addProductToCart(cart: CartItem[], product: Product): CartItem[] {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    return cart.map(item =>
      item.id === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
        : item);
  }

  return [...cart, { ...product, quantity: 1 }];
}

export function changeCartItemQuantity(cart: CartItem[], productId: string, delta: number): CartItem[] {
  return cart
    .map(item => item.id === productId ? { ...item, quantity: Math.max(0, Math.min(item.stockQuantity, item.quantity + delta)) } : item)
    .filter(item => item.quantity > 0);
}

export function getCartTotals(cart: CartItem[]) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * storefrontTaxRate;

  return {
    subtotal,
    tax,
    total: subtotal + tax,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export function hasValidStorefrontCustomer(customer: StorefrontCustomer) {
  return Boolean(customer.name.trim()) && isValidEmail(customer.email) && isValidPhone(customer.phone);
}

export function toStorefrontOrderItems(cart: CartItem[]) {
  return cart.map(item => ({ productId: item.id, quantity: item.quantity }));
}

export function getPaymentFingerprint(cart: CartItem[], customer: StorefrontCustomer, total: number) {
  return JSON.stringify({
    customer,
    items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
    total
  });
}
