import { Eye, Plus, Search } from 'lucide-react';
import { formatMoney } from '../../../helpers/format';
import { getProductImage } from '../../../helpers/productImages';
import type { Product } from '../../../models';

type ProductCatalogProps = {
  error?: string;
  loading?: boolean;
  products: Product[];
  search: string;
  onSearchChange: (search: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
};

export function ProductCatalog({ error = '', loading = false, products, search, onSearchChange, onAddToCart, onViewProduct }: ProductCatalogProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section aria-labelledby="products-heading" className="space-y-4" aria-busy={loading}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="products-heading" className="text-2xl font-semibold">Products</h2>
          <label className="relative block sm:w-80">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-line bg-white py-2 pl-9 pr-3"
              placeholder="Search by product, SKU, or description"
              type="search"
              maxLength={100}
              autoComplete="off"
              value={search}
              onChange={event => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
        {loading && <p className="text-sm text-slate-500" role="status">Loading products...</p>}
        {!loading && !error && products.length === 0 && (
          <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-slate-500">
            No products match your search.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              imagePriority={index === 0}
              onAddToCart={onAddToCart}
              onViewProduct={onViewProduct}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({
  product,
  imagePriority,
  onAddToCart,
  onViewProduct
}: {
  product: Product;
  imagePriority: boolean;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}) {
  const image = getProductImage(product.sku, product.name);

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <picture>
        <source
          type="image/webp"
          srcSet={image.webpSrcSet}
          sizes="(min-width: 1280px) 416px, (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)"
        />
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes="(min-width: 1280px) 416px, (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)"
          alt={image.alt}
          className="aspect-[4/3] w-full bg-field object-cover"
          width="360"
          height="270"
          loading={imagePriority ? 'eager' : 'lazy'}
          {...(imagePriority ? { fetchpriority: 'high' } : {})}
        />
      </picture>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">{product.name}</h3>
            <p className="mt-1 text-xs font-medium uppercase text-slate-500">{product.sku}</p>
          </div>
          <span className="flex-none rounded-md bg-teal-50 px-2 py-1 text-sm font-semibold text-brand">{formatMoney(product.price)}</span>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{product.description ?? 'Business-ready inventory item.'}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500">{product.stockQuantity} in stock</span>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-field"
              onClick={() => onViewProduct(product)}
              type="button"
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!product.isActive || product.stockQuantity <= 0}
              onClick={() => onAddToCart(product)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
