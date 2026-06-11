import type { Product } from '../../../models';

type ProductDetailContent = {
  headline: string;
  paragraphs: string[];
  highlights: string[];
};

const productDetails: Record<string, ProductDetailContent> = {
  'SCN-100': {
    headline: 'Compact scanning for busy counters and receiving desks.',
    paragraphs: [
      'The Countertop Scanner keeps checkout and inventory intake moving with a compact footprint that fits neatly beside a printer, cash drawer, or packing station.',
      'Use it for barcode lookups, order picking, stock checks, and quick product entry in small business workflows where speed matters but counter space is limited.'
    ],
    highlights: ['Hands-free counter placement', 'Fast barcode capture', 'Ideal for checkout and receiving']
  },
  'PRN-220': {
    headline: 'Reliable thermal receipts for order desks and pickup counters.',
    paragraphs: [
      'The Receipt Printer is designed for quick, low-maintenance transaction printing in storefronts, stock rooms, and fulfillment counters.',
      'It pairs naturally with barcode scanners and cash drawers, giving teams a simple way to produce receipts, pickup slips, and internal order notes.'
    ],
    highlights: ['Thermal print workflow', 'Compact order desk fit', 'Great for receipts and pickup slips']
  },
  'LBL-500': {
    headline: 'Durable label rolls for inventory and shelf organization.',
    paragraphs: [
      'Inventory Labels help teams keep products, bins, and shipments identifiable from receiving through fulfillment.',
      'The roll format supports repeatable label printing for SKU tags, storage locations, and lightweight shipping workflows.'
    ],
    highlights: ['Water-resistant label stock', 'Useful for SKU and bin labels', 'Supports organized receiving']
  },
  'SHP-310': {
    headline: 'High-speed label printing for fulfillment teams.',
    paragraphs: [
      'The Shipping Label Printer supports a faster path from packed order to outbound shipment with clear, scannable labels.',
      'It is a strong fit for stores that process daily shipping batches and need a dedicated station for packing and dispatch.'
    ],
    highlights: ['Dedicated shipping labels', 'Fulfillment station ready', 'Crisp barcode output']
  },
  'POS-700': {
    headline: 'Mobile order entry for flexible storefront workflows.',
    paragraphs: [
      'The Mobile POS Tablet lets staff take order details, review inventory, and assist customers away from a fixed counter.',
      'Its rugged profile makes it useful for pop-up counters, stock rooms, curbside pickup, and mobile checkout lanes.'
    ],
    highlights: ['Portable order entry', 'Useful for mobile checkout', 'Built for active retail teams']
  },
  'CDR-440': {
    headline: 'A sturdy cash drawer for payment and receipt stations.',
    paragraphs: [
      'The Cash Drawer gives retail teams a reliable place to manage cash transactions during checkout and delivery handoff.',
      'Use it with receipt printers and POS tablets to build a complete counter setup for mixed payment workflows.'
    ],
    highlights: ['Steel drawer construction', 'Counter checkout ready', 'Fits mixed payment workflows']
  },
  'HSC-210': {
    headline: 'Wireless scanning for receiving, picking, and inventory checks.',
    paragraphs: [
      'The Handheld Scanner gives teams mobility when scanning shelves, bins, packages, and product labels around the store.',
      'It is especially useful for receiving new stock, verifying picked orders, and reducing manual SKU entry.'
    ],
    highlights: ['Wireless scan mobility', 'Good for stock rooms', 'Reduces manual entry']
  },
  'TPE-120': {
    headline: 'Packing tape for everyday fulfillment stations.',
    paragraphs: [
      'The Packing Tape Case keeps shipping areas stocked for daily order packing and outbound fulfillment.',
      'It is a practical consumable for teams that want predictable supplies on hand as order volume grows.'
    ],
    highlights: ['Clear packing tape', 'Fulfillment station staple', 'Useful for daily shipping']
  },
  'BCL-250': {
    headline: 'Barcode labels for clean inventory tracking.',
    paragraphs: [
      'The Barcode Label Roll supports product tagging, bin labeling, and inventory workflows that depend on clean scan results.',
      'Use it to keep stock locations consistent and make receiving, cycle counts, and order picking easier to audit.'
    ],
    highlights: ['Thermal barcode labels', 'Inventory tracking ready', 'Supports cycle counts']
  },
  'ODS-880': {
    headline: 'An adjustable stand for tablets and order monitors.',
    paragraphs: [
      'The Order Desk Stand keeps tablets and compact screens positioned for comfortable order entry and customer service.',
      'It helps create a cleaner workspace for checkout, fulfillment review, and shared order status screens.'
    ],
    highlights: ['Adjustable viewing angle', 'Desk and counter friendly', 'Supports tablet workflows']
  }
};

export function getProductDetailContent(product: Product): ProductDetailContent {
  return productDetails[product.sku] ?? {
    headline: `${product.name} for practical ecommerce operations.`,
    paragraphs: [
      `${product.name} supports small business ordering workflows with a straightforward setup and reliable day-to-day use.`,
      'Add it to a storefront cart, review the order, and send the purchase through the demo checkout flow.'
    ],
    highlights: ['Small business ready', 'Works with demo checkout', 'Useful operational product']
  };
}
