export type OrderStatus = 'Draft' | 'Submitted' | 'Processing' | 'Completed' | 'Cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdByUserId: string;
  createdAt: string;
  items: OrderItem[];
}
