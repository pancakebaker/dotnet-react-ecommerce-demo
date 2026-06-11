import type { Order, Product } from '../models';
import { formatMoney } from './format';
import { addPdfBrandHeader, addPdfPageNumbers, dateStamp, loadPdfTools, pdfTableDefaults, saveDatedPdf } from './pdf';

export function downloadOrdersCsv(orders: Order[]) {
  const csv = buildOrdersCsv(orders);
  downloadTextFile(csv, `ecommerce-demo-orders-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
}

export function buildOrdersCsv(orders: Order[]): string {
  const headers = [
    'Order Number',
    'Customer',
    'Status',
    'Subtotal',
    'Tax',
    'Discount',
    'Total',
    'Created At',
    'Items'
  ];

  const rows = orders.map(order => [
    order.orderNumber,
    order.customerName,
    order.status,
    order.subtotal.toFixed(2),
    order.tax.toFixed(2),
    order.discount.toFixed(2),
    order.total.toFixed(2),
    new Date(order.createdAt).toLocaleString(),
    order.items.map(item => `${item.quantity} x ${item.productName} @ ${item.unitPrice.toFixed(2)}`).join('; ')
  ]);

  return [headers, ...rows]
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}

export async function downloadProductsPdf(products: Product[]) {
  const { jsPDF, autoTable } = await loadPdfTools();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString();

  addPdfBrandHeader(doc, 'Ecommerce Demo Product Catalog', `Generated ${generatedAt}`);

  autoTable(doc, {
    startY: 112,
    head: [['Product', 'SKU', 'Description', 'Price', 'Stock', 'Status']],
    body: products.map(product => [
      product.name,
      product.sku,
      product.description ?? '-',
      formatMoney(product.price),
      product.stockQuantity.toString(),
      product.isActive ? 'Active' : 'Inactive'
    ]),
    ...pdfTableDefaults(),
    styles: {
      ...pdfTableDefaults().styles,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 260 },
      3: { cellWidth: 75, halign: 'right' },
      4: { cellWidth: 65, halign: 'right' },
      5: { cellWidth: 75 }
    }
  });

  addPdfPageNumbers(doc);

  saveDatedPdf(doc, 'ecommerce-demo-products');
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadTextFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
