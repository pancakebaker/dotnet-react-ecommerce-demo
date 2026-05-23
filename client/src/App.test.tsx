import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './components/StatCard';
import { LoginScreen } from './features/auth/LoginScreen';
import { buildOrdersTrend, buildProductStock } from './helpers/dashboardCharts';
import { buildOrdersCsv } from './helpers/exports';
import { formatMoney } from './helpers/format';
import { isValidEmail, isValidPhone, phonePattern } from './helpers/validation';
import type { Order, Product } from './models';
import type { ApiClient } from './services/apiClient';

describe('formatMoney', () => {
  it('formats dashboard revenue', () => {
    expect(formatMoney(1289.5)).toBe('$1,289.50');
  });
});

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Orders" value={12} />);

    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('dashboard chart helpers', () => {
  it('groups orders by date and keeps revenue totals', () => {
    const orders = [
      orderFactory('2026-05-20T02:00:00Z', 100),
      orderFactory('2026-05-20T04:00:00Z', 40),
      orderFactory('2026-05-21T02:00:00Z', 75)
    ];

    const trend = buildOrdersTrend(orders);

    expect(trend).toHaveLength(7);
    expect(trend[trend.length - 2]).toMatchObject({ orders: 2, revenue: 140 });
    expect(trend[trend.length - 1]).toMatchObject({ orders: 1, revenue: 75 });
  });

  it('sorts product stock for the bar chart', () => {
    const stock = buildProductStock([
      productFactory('SCN-100', 24),
      productFactory('PRN-220', 16),
      productFactory('LBL-500', 180)
    ]);

    expect(stock).toEqual([
      { label: 'LBL-500', value: 180 },
      { label: 'SCN-100', value: 24 },
      { label: 'PRN-220', value: 16 }
    ]);
  });
});

describe('export helpers', () => {
  it('builds order CSV with line item details', () => {
    const order = orderFactory('2026-05-21T02:00:00Z', 112);
    order.items = [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Countertop Scanner',
        quantity: 2,
        unitPrice: 50,
        lineTotal: 100
      }
    ];

    const csv = buildOrdersCsv([order]);

    expect(csv).toContain('"Order Number","Customer","Status"');
    expect(csv).toContain('"2 x Countertop Scanner @ 50.00"');
  });
});

describe('input validation helpers', () => {
  it('uses a browser-compatible phone pattern', () => {
    expect(() => new RegExp(`^(?:${phonePattern})$`, 'v')).not.toThrow();
    expect(isValidPhone('+1 555-0199')).toBe(true);
    expect(isValidPhone('43545')).toBe(false);
  });

  it('requires customer emails to include a full domain', () => {
    expect(isValidEmail('emil.tele.xcv@gmail.com')).toBe(true);
    expect(isValidEmail('emil.tele.xcv@gmail')).toBe(false);
  });
});

describe('LoginScreen', () => {
  it('toggles password visibility', () => {
    const api = { login: async () => { throw new Error('not used'); } } as unknown as ApiClient;

    render(<LoginScreen api={api} onAuthenticated={() => undefined} onBack={() => undefined} />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

function orderFactory(createdAt: string, total: number): Order {
  return {
    id: crypto.randomUUID(),
    orderNumber: 'OF-TEST',
    customerId: crypto.randomUUID(),
    customerName: 'Test Customer',
    status: 'Submitted',
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    createdByUserId: crypto.randomUUID(),
    createdAt,
    items: []
  };
}

function productFactory(sku: string, stockQuantity: number): Product {
  return {
    id: crypto.randomUUID(),
    name: sku,
    sku,
    price: 10,
    stockQuantity,
    isActive: true
  };
}
