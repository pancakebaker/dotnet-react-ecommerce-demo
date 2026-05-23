import type { Order, Product } from '../models';
import { formatMoney } from './format';

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
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString();

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 86, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Ecommerce Demo Product Catalog', 40, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated ${generatedAt}`, 40, 62);

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
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 8,
      lineColor: [217, 222, 231],
      lineWidth: 0.6,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [246, 247, 249]
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 260 },
      3: { cellWidth: 75, halign: 'right' },
      4: { cellWidth: 65, halign: 'right' },
      5: { cellWidth: 75 }
    },
    margin: { left: 40, right: 40 }
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.getWidth() - 92, doc.internal.pageSize.getHeight() - 28);
  }

  doc.save(`ecommerce-demo-products-${dateStamp()}.pdf`);
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

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
