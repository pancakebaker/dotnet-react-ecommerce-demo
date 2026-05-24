export type CheckoutStep = 'cart' | 'customer' | 'review';

export const checkoutSteps: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'cart', label: 'Cart' },
  { id: 'customer', label: 'Customer details' },
  { id: 'review', label: 'Place order' }
];
