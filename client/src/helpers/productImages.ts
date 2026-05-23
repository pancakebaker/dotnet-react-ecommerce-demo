export type ProductImage = {
  src: string;
  srcSet: string;
  webpSrcSet: string;
  alt: string;
};

function productImage(baseName: string, alt: string): ProductImage {
  return {
    src: `/images/${baseName}-360.jpg`,
    srcSet: `/images/${baseName}-360.jpg 360w, /images/${baseName}-720.jpg 720w`,
    webpSrcSet: `/images/${baseName}-360.webp 360w, /images/${baseName}-480.webp 480w, /images/${baseName}-720.webp 720w`,
    alt
  };
}

export const productImages: Record<string, ProductImage> = {
  'SCN-100': productImage('countertop-barcode-scanner-product', 'Countertop barcode scanner product for small business order management'),
  'LBL-500': productImage('blank-inventory-label-roll-product', 'Roll of blank inventory labels for product and warehouse tracking'),
  'PRN-220': productImage('thermal-receipt-printer-product', 'Compact thermal receipt printer for storefront and order desk workflows'),
  'SHP-310': productImage('shipping-label-printer-product', 'Shipping label printer for small business fulfillment and order processing'),
  'POS-700': productImage('mobile-pos-tablet-product', 'Mobile point of sale tablet for small business order entry'),
  'CDR-440': productImage('cash-drawer-product', 'Cash drawer for retail checkout and small business order counters'),
  'HSC-210': productImage('wireless-handheld-scanner-product', 'Wireless handheld barcode scanner for inventory receiving workflows'),
  'TPE-120': productImage('packing-tape-rolls-product', 'Packing tape case for fulfillment and shipping stations'),
  'BCL-250': productImage('barcode-label-roll-product', 'Barcode label roll for small business inventory tracking'),
  'ODS-880': productImage('adjustable-order-desk-stand-product', 'Adjustable order desk stand for tablets and checkout monitors')
};

export function getProductImage(sku: string, productName: string): ProductImage {
  return productImages[sku] ?? {
    src: '/images/ecommerce-demo-storefront-hero-720.jpg',
    srcSet: '/images/ecommerce-demo-storefront-hero-720.jpg 720w, /images/ecommerce-demo-storefront-hero-1280.jpg 1280w',
    webpSrcSet: '/images/ecommerce-demo-storefront-hero-720.webp 720w, /images/ecommerce-demo-storefront-hero-1280.webp 1280w',
    alt: `${productName} product for small business ordering`
  };
}
