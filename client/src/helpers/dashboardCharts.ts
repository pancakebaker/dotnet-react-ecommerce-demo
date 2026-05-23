import type { Order, Product } from '../models';

export type OrdersTrendPoint = {
  label: string;
  orders: number;
  revenue: number;
};

export type ProductStockPoint = {
  label: string;
  value: number;
};

export function buildOrdersTrend(orders: Order[]): OrdersTrendPoint[] {
  if (orders.length === 0) {
    return [];
  }

  const validDates = orders
    .map(order => new Date(order.createdAt))
    .filter(date => !Number.isNaN(date.getTime()));
  const endDate = validDates.length > 0
    ? new Date(Math.max(...validDates.map(date => date.getTime())))
    : new Date();
  const buckets = new Map<string, OrdersTrendPoint>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - offset);
    buckets.set(toDateKey(date), {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: 0,
      revenue: 0
    });
  }

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const key = toDateKey(date);
    const current = buckets.get(key);
    if (!current) return;

    current.orders += 1;
    current.revenue += order.total;
  });

  return Array.from(buckets.values());
}

export function buildProductStock(products: Product[]): ProductStockPoint[] {
  return products
    .slice()
    .sort((left, right) => right.stockQuantity - left.stockQuantity)
    .slice(0, 6)
    .map(product => ({
      label: product.sku,
      value: product.stockQuantity
    }));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
