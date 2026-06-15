import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../models';
import type { ApiClient } from '../../services/apiClient';
import { StorefrontPage } from './StorefrontPage';

const product: Product = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Countertop Barcode Scanner',
  sku: 'SCN-100',
  description: 'Fast checkout scanning for compact counters.',
  price: 145.59,
  stockQuantity: 12,
  isActive: true
};

describe('StorefrontPage checkout journey', () => {
  afterEach(() => {
    delete window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__;
    vi.restoreAllMocks();
  });

  it('adds a product to cart and submits an order with paymentIntentId', async () => {
    window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__ = 'pi_test_paid';
    const api = storefrontApi();

    render(<StorefrontPage api={api} onSignIn={() => undefined} />);

    await screen.findByText(product.name);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to customer details' }));

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Front Door Buyer' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.test' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1 555-0188' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '15 Checkout Lane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review order' }));

    await screen.findByRole('button', { name: 'Place order' });
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => expect(api.placeStorefrontOrder).toHaveBeenCalled());
    expect(api.placeStorefrontOrder).toHaveBeenCalledWith(expect.objectContaining({
      paymentMethod: 'card',
      paymentIntentId: 'pi_test_paid',
      items: [{ productId: product.id, quantity: 1 }]
    }));
  });

  it('shows a friendly checkout error when order placement fails', async () => {
    window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__ = 'pi_test_paid';
    const api = storefrontApi();
    api.placeStorefrontOrder.mockRejectedValue(new Error('Payment could not be verified.'));

    render(<StorefrontPage api={api} onSignIn={() => undefined} />);

    await screen.findByText(product.name);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to customer details' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Front Door Buyer' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review order' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Place order' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment could not be verified.');
  });
});

function storefrontApi() {
  return {
    storefrontProducts: vi.fn(async () => [product]),
    prepareStorefrontPayment: vi.fn(async () => ({
      clientSecret: 'pi_test_paid_secret_client',
      paymentIntentId: 'pi_test_paid',
      amount: 16306,
      currency: 'usd',
      status: 'requires_payment_method',
      paymentMethod: 'card'
    })),
    placeStorefrontOrder: vi.fn(async () => ({
      id: 'order-1',
      orderNumber: 'OF-TEST-0001',
      customerId: 'customer-1',
      customerName: 'Front Door Buyer',
      status: 'Submitted',
      subtotal: 145.59,
      tax: 17.47,
      discount: 0,
      total: 163.06,
      createdByUserId: 'storefront-user',
      createdAt: '2026-06-15T00:00:00Z',
      items: []
    }))
  } as unknown as ApiClient & {
    storefrontProducts: ReturnType<typeof vi.fn>;
    prepareStorefrontPayment: ReturnType<typeof vi.fn>;
    placeStorefrontOrder: ReturnType<typeof vi.fn>;
  };
}
