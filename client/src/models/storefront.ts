import type { Product } from './product';

export type StorefrontCustomer = {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
};

export interface StorefrontCheckoutRequest {
  customer: StorefrontCustomer;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export type CartItem = Product & { quantity: number };
