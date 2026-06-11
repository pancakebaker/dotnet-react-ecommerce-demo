export function applyStorefrontMetadata() {
  document.title = 'Ecommerce Demo Storefront - Business Ordering Demo';
  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute('content', 'Ecommerce Demo storefront demo with product catalog, customer checkout, cart ordering, and a connected ASP.NET Core order management API.');
}

export function applyProductMetadata(productName: string, summary: string) {
  document.title = `${productName} - Ecommerce Demo Storefront`;
  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute('content', summary);
}
