import type { Product } from '../../../models';
import { productSlug } from './productSlugs';

export const storefrontHomePath = '/';
export const checkoutPath = '/checkout';

export type StorefrontRoute = {
  view: 'home' | 'product' | 'checkout';
  productSlug: string | null;
};

export function parseStorefrontRoute(pathname: string): StorefrontRoute {
  if (pathname === checkoutPath) {
    return { view: 'checkout', productSlug: null };
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    return { view: 'product', productSlug: productMatch[1] };
  }

  return { view: 'home', productSlug: null };
}

export function productPath(product: Pick<Product, 'name'>) {
  return `/products/${productSlug(product)}`;
}

export function productPathFromSlug(slug: string | null) {
  return slug ? `/products/${slug}` : storefrontHomePath;
}
