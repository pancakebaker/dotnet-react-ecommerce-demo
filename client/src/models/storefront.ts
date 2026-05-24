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
  paymentIntentId?: string;
}

export interface StorefrontPaymentIntentRequest {
  customer: StorefrontCustomer;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
}

export interface StorefrontPaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export type CartItem = Product & { quantity: number };
