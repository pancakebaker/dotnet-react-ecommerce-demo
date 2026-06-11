import { formatMoney } from '../../../helpers/format';
import {
  addPdfBrandHeader,
  addPdfPageNumbers,
  addWrappedPdfText,
  ensurePdfContentY,
  getLastAutoTableY,
  loadPdfTools,
  pdfTableDefaults
} from '../../../helpers/pdf';
import type { CartItem, PaymentMethodId, StorefrontCustomer } from '../../../models';

export type StorefrontInvoice = {
  orderNumber: string;
  customer: StorefrontCustomer;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethodId;
};

export async function downloadStorefrontInvoice(invoice: StorefrontInvoice) {
  const { jsPDF, autoTable } = await loadPdfTools();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString();

  addPdfBrandHeader(doc, 'Ecommerce Demo Invoice', `Order ${invoice.orderNumber}`, 84);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To', 40, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const billToLines = [
    invoice.customer.name,
    invoice.customer.companyName,
    invoice.customer.email,
    invoice.customer.phone,
    invoice.customer.address
  ].filter((value): value is string => Boolean(value));

  let billToY = 140;
  billToLines.forEach(line => {
    billToY = addWrappedPdfText(doc, line, 40, billToY, 285);
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Payment', 380, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(paymentMethodLabel(invoice.paymentMethod), 380, 140);
  doc.text(`Generated ${generatedAt}`, 380, 156);

  autoTable(doc, {
    startY: Math.max(240, billToY + 24),
    head: [['Item', 'Qty', 'Unit', 'Line total']],
    body: invoice.cart.map(item => [
      item.name,
      item.quantity.toString(),
      formatMoney(item.price),
      formatMoney(item.price * item.quantity)
    ]),
    ...pdfTableDefaults(),
    columnStyles: {
      1: { halign: 'right', cellWidth: 56 },
      2: { halign: 'right', cellWidth: 90 },
      3: { halign: 'right', cellWidth: 100 }
    }
  });

  const summaryY = getLastAutoTableY(doc, 300);
  const rows: Array<[string, string]> = [
    ['Subtotal', formatMoney(invoice.subtotal)],
    ['Tax', formatMoney(invoice.tax)],
    ['Total due', formatMoney(invoice.total)]
  ];

  doc.setFontSize(10);
  const summaryStartY = ensurePdfContentY(doc, summaryY + 32, rows.length * 20);
  rows.forEach(([label, value], index) => {
    const y = summaryStartY + index * 20;
    doc.setFont('helvetica', index === rows.length - 1 ? 'bold' : 'normal');
    doc.text(label, 380, y);
    doc.text(value, 540, y, { align: 'right' });
  });

  addPdfPageNumbers(doc);
  doc.save(`ecommerce-demo-invoice-${invoice.orderNumber}.pdf`);
}

function paymentMethodLabel(paymentMethod: PaymentMethodId) {
  if (paymentMethod === 'cash_on_delivery') return 'Cash on delivery';
  return 'Visa / Mastercard';
}
