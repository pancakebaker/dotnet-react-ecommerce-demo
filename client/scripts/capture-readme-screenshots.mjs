import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:5173';
const outputDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots');

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

const products = [
  product('product-scanner', 'Countertop Scanner', 'SCN-100', 'Compact barcode scanner', 149, 24),
  product('product-printer', 'Receipt Printer', 'PRN-220', 'Thermal printer for order desks', 229, 16),
  product('product-labels', 'Inventory Labels', 'LBL-500', 'Water resistant label roll', 19.95, 180),
  product('product-shipping', 'Shipping Label Printer', 'SHP-310', 'High-speed printer for shipping labels', 279, 12),
  product('product-tablet', 'Mobile POS Tablet', 'POS-700', 'Rugged tablet for mobile order entry', 399, 9),
  product('product-drawer', 'Cash Drawer', 'CDR-440', 'Steel cash drawer with receipt printer trigger', 119, 14),
  product('product-handheld', 'Handheld Scanner', 'HSC-210', 'Wireless scanner for stock rooms and receiving', 189, 21),
  product('product-tape', 'Packing Tape Case', 'TPE-120', 'Clear packing tape for fulfillment stations', 34.5, 72),
  product('product-barcodes', 'Barcode Label Roll', 'BCL-250', 'Thermal barcode labels for inventory tracking', 29.95, 130),
  product('product-stand', 'Order Desk Stand', 'ODS-880', 'Adjustable stand for tablets and order monitors', 84, 18)
];

const user = {
  id: 'user-admin',
  firstName: 'Ava',
  lastName: 'Admin',
  email: 'admin@ecommerce-demo.test',
  role: 'Admin'
};

const orders = [
  order('order-2', 'OF-20260521-0002', 'Emil John Tele', 'Processing', 345.86, '2026-05-21T02:00:00Z'),
  order('order-1', 'OF-20260521-0001', 'Northwind Supplies', 'Completed', 430.48, '2026-05-20T02:00:00Z')
];

await page.route('**/api/storefront/products**', async route => {
  await route.fulfill({ json: products });
});

await page.route('**/api/auth/login', async route => {
  await route.fulfill({ json: { token: 'screenshot-token', user } });
});

await page.route('**/api/profile', async route => {
  await route.fulfill({ json: user });
});

await page.route('**/api/dashboard/summary', async route => {
  await route.fulfill({
    json: {
      totalCustomers: 3,
      totalOrders: orders.length,
      pendingOrders: 1,
      completedOrders: 1,
      monthlyRevenue: 430.48,
      recentActivity: [
        {
          entityType: 'Order',
          entityId: 'order-1',
          action: 'Seeded',
          description: 'Demo order OF-20260521-0001 was created.',
          createdAt: '2026-05-21T02:00:00Z'
        }
      ]
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
      items: products.slice(0, 8),
      page: 1,
      pageSize: 8,
      totalCount: products.length,
      totalPages: 2
    }
  });
});

async function capture(name) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(outputDir, `${name}.jpg`),
    type: 'jpeg',
    quality: 86,
    fullPage: false
  });
}

await page.goto(baseUrl);
await capture('storefront');

await page.getByRole('button', { name: 'Add to cart' }).first().click();
await page.getByRole('button', { name: 'Checkout' }).click();
await page.getByRole('heading', { name: 'Review your cart' }).waitFor();
await page.getByRole('button', { name: 'Continue to customer details' }).click();
await page.getByRole('heading', { name: 'Customer details' }).waitFor();
await capture('checkout');
await page.getByRole('button', { name: 'Continue shopping' }).click();

await page.getByRole('button', { name: 'Staff sign in' }).click();
await capture('login');

await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
await capture('dashboard');

await page.getByRole('button', { name: 'Orders' }).first().click();
await page.getByRole('heading', { name: /OF-/ }).first().waitFor();
await capture('orders');

await browser.close();

console.log(`README screenshots saved to ${outputDir}`);

function product(id, name, sku, description, price, stockQuantity) {
  return {
    id,
    name,
    sku,
    description,
    price,
    stockQuantity,
    isActive: true
  };
}

function order(id, orderNumber, customerName, status, total, createdAt) {
  return {
    id,
    orderNumber,
    customerId: `${id}-customer`,
    customerName,
    status,
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    createdByUserId: user.id,
    createdAt,
    items: []
  };
}
