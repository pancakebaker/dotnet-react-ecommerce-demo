import type { Product } from '../../../models';

export function productSlug(product: Pick<Product, 'name'>) {
  return product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
