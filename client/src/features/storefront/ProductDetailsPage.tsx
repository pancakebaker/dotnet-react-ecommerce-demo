import { ArrowLeft, PackagePlus, ShoppingCart } from 'lucide-react';
import { useEffect } from 'react';
import { formatMoney } from '../../helpers/format';
import { getProductImage } from '../../helpers/productImages';
import type { Product } from '../../models';
import { CommerceHero } from './components/CommerceHero';
import { StorefrontHeader } from './components/StorefrontHeader';
import { getProductDetailContent } from './helpers/productContent';
import { applyProductMetadata } from './helpers/storefrontSeo';

type ProductDetailsPageProps = {
  product: Product;
  cartCount: number;
  onAddToCart: (product: Product) => void;
  onBackToProducts: () => void;
  onCheckout: () => void;
  onSignIn: () => void;
};

export function ProductDetailsPage({
  product,
  cartCount,
  onAddToCart,
  onBackToProducts,
  onCheckout,
  onSignIn
}: ProductDetailsPageProps) {
  const image = getProductImage(product.sku, product.name);
  const content = getProductDetailContent(product);

  useEffect(() => {
    applyProductMetadata(product.name, content.headline);
  }, [content.headline, product.name]);

  return (
    <div className="min-h-screen bg-field text-ink">
      <StorefrontHeader onHome={onBackToProducts} onSignIn={onSignIn} />
      <CommerceHero
        eyebrow={product.sku}
        title={product.name}
        description={content.headline}
        background={image}
        actions={[
          {
            label: 'Add to cart',
            onClick: () => onAddToCart(product),
            icon: <PackagePlus className="h-4 w-4" />,
            disabled: !product.isActive || product.stockQuantity <= 0
          },
          {
            label: cartCount > 0 ? `Checkout (${cartCount})` : 'Checkout',
            onClick: onCheckout,
            icon: <ShoppingCart className="h-4 w-4" />,
            disabled: cartCount === 0
          }
        ]}
        stats={[
          { label: 'Price', value: formatMoney(product.price) },
          { label: 'Stock', value: product.stockQuantity.toString() },
          { label: 'Status', value: product.isActive ? 'Active' : 'Inactive' }
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <button
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-field"
          onClick={onBackToProducts}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Product details</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
              {content.paragraphs.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Highlights</h2>
            <ul className="mt-4 space-y-3">
              {content.highlights.map(highlight => (
                <li className="flex gap-3 text-sm text-slate-700" key={highlight}>
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-brand" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-md bg-field p-4 text-sm text-slate-700">
              <p className="font-semibold text-ink">Demo checkout note</p>
              <p className="mt-1 leading-6">
                This page uses the same cart and checkout flow as the storefront catalog.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
