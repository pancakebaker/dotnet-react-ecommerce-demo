import type { Product } from './product';

export type StorefrontCustomer = {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
};

export type PaymentMethodId = string;

export interface StorefrontCheckoutRequest {
  customer: StorefrontCustomer;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod?: PaymentMethodId;
  paymentReferenceId?: string;
  paymentIntentId?: string;
}

export interface StorefrontPaymentIntentRequest {
  customer: StorefrontCustomer;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
  paymentMethod?: PaymentMethodId;
}

export interface StorefrontPaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  paymentReferenceId?: string;
  paymentMethod: PaymentMethodId;
  amount: number;
  currency: string;
  status: string;
}

export type CartItem = Product & { quantity: number };
