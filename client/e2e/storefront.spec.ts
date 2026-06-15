import { expect, test, type Page } from '@playwright/test';

const products = [
  {
    id: 'product-scanner',
    name: 'Countertop Scanner',
    sku: 'SCN-100',
    description: 'Fast barcode scanner for retail checkout.',
    price: 129.99,
    stockQuantity: 12,
    isActive: true
  },
  {
    id: 'product-labels',
    name: 'Inventory Labels',
    sku: 'LBL-500',
    description: 'Durable labels for stock rooms and shelves.',
    price: 24.5,
    stockQuantity: 40,
    isActive: true
  }
];

async function routePaymentPreparation(page: Page, paymentIntentId: string) {
  await page.route('**/api/storefront/payments/prepare', async route => {
    await route.fulfill({
      json: {
        paymentIntentId,
        clientSecret: `${paymentIntentId}_secret_e2e`,
        amount: 14559,
        currency: 'usd'
      }
    });
  });
}

test('visitor can add a product, enter customer details, and place an order', async ({ page }) => {
  await page.addInitScript(() => {
    window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__ = 'pi_e2e_paid';
  });

  await routePaymentPreparation(page, 'pi_e2e_paid');

  await page.route('**/api/storefront/products**', async route => {
    await route.fulfill({ json: products });
  });

  await page.route('**/api/storefront/orders', async route => {
    const payload = route.request().postDataJSON();

    expect(payload.customer).toMatchObject({
      name: 'Front Door Buyer',
      companyName: 'Public Demo Co',
      email: 'buyer@example.test',
      phone: '+1 555-0188',
      address: '15 Checkout Lane'
    });
    expect(payload.items).toEqual([{ productId: 'product-scanner', quantity: 1 }]);
    expect(payload.paymentIntentId).toBe('pi_e2e_paid');
    expect(payload.paymentReferenceId).toBeUndefined();

    await route.fulfill({
      status: 201,
      json: {
        id: 'order-1',
        orderNumber: 'OF-E2E-0001',
        customerId: 'customer-1',
        customerName: 'Front Door Buyer',
        status: 'Submitted',
        subtotal: 129.99,
        tax: 15.6,
        discount: 0,
        total: 145.59,
        createdByUserId: 'storefront',
        createdAt: new Date().toISOString(),
        items: []
      }
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /order products online/i })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Review your cart' })).toBeVisible();
  await expect(page.getByRole('complementary').getByText('$145.59')).toBeVisible();

  await page.getByRole('button', { name: 'Continue to customer details' }).click();

  await page.getByLabel('Name').fill('Front Door Buyer');
  await page.getByLabel('Company').fill('Public Demo Co');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Phone').fill('+1 555-0188');
  await page.getByLabel('Address').fill('15 Checkout Lane');

  await page.getByRole('button', { name: 'Review order' }).click();
  await page.getByRole('button', { name: 'Place order', exact: true }).click();

  await expect(page.getByRole('dialog')).toContainText('Order OF-E2E-0001 has been placed successfully.');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('heading', { name: /order products online/i })).toBeVisible();
});

test('checkout shows a friendly order error when order placement fails', async ({ page }) => {
  await routePaymentPreparation(page, 'pi_e2e_pending');

  await page.route('**/api/storefront/products**', async route => {
    await route.fulfill({ json: products });
  });

  await page.route('**/api/storefront/orders', async route => {
    const payload = route.request().postDataJSON();

    expect(payload.paymentMethod).toBe('cash_on_delivery');
    expect(payload.paymentIntentId).toBeUndefined();

    await route.fulfill({
      status: 400,
      json: { message: 'Payment could not be verified.' }
    });
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Continue to customer details' }).click();
  await page.getByLabel('Name').fill('Front Door Buyer');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Phone').fill('+1 555-0188');
  await page.getByLabel('Address').fill('15 Checkout Lane');
  await page.getByRole('button', { name: 'Review order' }).click();
  await page.getByRole('radio', { name: /Cash on delivery/ }).check();
  await page.getByRole('button', { name: /Place order for/ }).click();

  await expect(page.getByRole('alert')).toContainText('Payment could not be verified.');
});

test('checkout shows mobile validation before submitting', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.route('**/api/storefront/products**', async route => {
    await route.fulfill({ json: products });
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Continue to customer details' }).click();

  await page.getByLabel('Name').fill('Front Door Buyer');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Phone').fill('43545');

  await expect(page.getByText('Enter a mobile number like +1 555-0199.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review order' })).toBeDisabled();
  expect(consoleErrors.filter(message => message.includes('Pattern attribute'))).toEqual([]);
});

test('checkout requires email addresses to include a full domain', async ({ page }) => {
  await page.route('**/api/storefront/products**', async route => {
    await route.fulfill({ json: products });
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Continue to customer details' }).click();

  await page.getByLabel('Name').fill('Front Door Buyer');
  await page.getByLabel('Email').fill('emil.tele.xcv@gmail');
  await page.getByLabel('Phone').fill('+1 555-0188');

  await expect(page.getByText('Enter an email address with a full domain, like emil@example.com.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review order' })).toBeDisabled();
});
