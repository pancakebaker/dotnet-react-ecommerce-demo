import { expect, test } from '@playwright/test';

const user = {
  id: 'user-1',
  firstName: 'Ava',
  lastName: 'Admin',
  email: 'admin@ecommerce-demo.test',
  role: 'Admin'
};

const orders = [
  {
    id: 'order-processing',
    orderNumber: 'OF-20260521-0002',
    customerId: 'customer-1',
    customerName: 'Emil John Tele',
    status: 'Processing',
    subtotal: 120,
    tax: 14.4,
    discount: 0,
    total: 134.4,
    createdByUserId: 'user-1',
    createdAt: '2026-05-21T03:00:00Z',
    items: []
  },
  {
    id: 'order-completed',
    orderNumber: 'OF-20260521-0001',
    customerId: 'customer-2',
    customerName: 'Northwind Supplies',
    status: 'Completed',
    subtotal: 250,
    tax: 30,
    discount: 0,
    total: 280,
    createdByUserId: 'user-1',
    createdAt: '2026-05-21T02:00:00Z',
    items: []
  },
  {
    id: 'order-cancelled',
    orderNumber: 'OF-20260521-0000',
    customerId: 'customer-3',
    customerName: 'Blue Harbor Cafe',
    status: 'Cancelled',
    subtotal: 80,
    tax: 9.6,
    discount: 0,
    total: 89.6,
    createdByUserId: 'user-1',
    createdAt: '2026-05-21T01:00:00Z',
    items: []
  }
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(storedUser => {
    window.localStorage.setItem('ecommerce-demo.token', 'e2e-token');
    window.localStorage.setItem('ecommerce-demo.user', JSON.stringify(storedUser));
  }, user);

  await page.route('**/api/dashboard/summary', async route => {
    await route.fulfill({
      json: {
        totalCustomers: 3,
        totalOrders: 3,
        pendingOrders: 1,
        completedOrders: 1,
        monthlyRevenue: 280,
        recentActivity: []
      }
    });
  });

  await page.route('**/api/orders**', async route => {
    await route.fulfill({
      json: {
        items: orders,
        page: 1,
        pageSize: 8,
        totalCount: orders.length,
        totalPages: 1
      }
    });
  });

  await page.route('**/api/products**', async route => {
    await route.fulfill({
      json: {
        items: [
          {
            id: 'product-scanner',
            name: 'Countertop Scanner',
            sku: 'SCN-100',
            description: 'Fast barcode scanner for retail checkout.',
            price: 129.99,
            stockQuantity: 12,
            isActive: true
          }
        ],
        page: 1,
        pageSize: 8,
        totalCount: 1,
        totalPages: 1
      }
    });
  });
});

test('staff can scan order cards by color-coded status', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Orders' }).click();

  const processingCard = page.locator('article').filter({ hasText: 'OF-20260521-0002' });
  const completedCard = page.locator('article').filter({ hasText: 'OF-20260521-0001' });
  const cancelledCard = page.locator('article').filter({ hasText: 'OF-20260521-0000' });

  await expect(page.getByRole('heading', { name: 'OF-20260521-0002' })).toBeVisible();
  await expect(processingCard.getByText('Processing').first()).toBeVisible();
  await expect(completedCard.getByText('Completed').first()).toBeVisible();
  await expect(cancelledCard.getByText('Cancelled').first()).toBeVisible();

  await expect(processingCard).toHaveClass(/border-l-amber-500/);
  await expect(completedCard).toHaveClass(/border-l-emerald-500/);
  await expect(cancelledCard).toHaveClass(/border-l-rose-500/);
});

test('staff can download order CSV and product PDF exports', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Orders' }).click();

  const csvDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const csvDownload = await csvDownloadPromise;

  expect(csvDownload.suggestedFilename()).toMatch(/^ecommerce-demo-orders-\d{4}-\d{2}-\d{2}\.csv$/);

  await page.getByRole('button', { name: 'Products' }).click();
  await expect(page.getByRole('heading', { name: 'Products' }).first()).toBeVisible();

  const pdfDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const pdfDownload = await pdfDownloadPromise;

  expect(pdfDownload.suggestedFilename()).toMatch(/^ecommerce-demo-products-\d{4}-\d{2}-\d{2}\.pdf$/);
});
