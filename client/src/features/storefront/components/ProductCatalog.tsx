import { Eye, Plus, Search } from 'lucide-react';
import { formatMoney } from '../../../helpers/format';
import { getProductImage } from '../../../helpers/productImages';
import type { Product } from '../../../models';

type ProductCatalogProps = {
  products: Product[];
  search: string;
  onSearchChange: (search: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
};

export function ProductCatalog({ products, search, onSearchChange, onAddToCart, onViewProduct }: ProductCatalogProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section aria-labelledby="products-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="products-heading" className="text-2xl font-semibold">Products</h2>
          <label className="relative block sm:w-80">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="focus-ring w-full rounded-md border border-line bg-white py-2 pl-9 pr-3"
              placeholder="Search by product, SKU, or description"
              value={search}
              onChange={event => onSearchChange(event.target.value)}
            />
          </label>
        </div>

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
          fetchPriority={imagePriority ? 'high' : 'auto'}
        />
      </picture>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="mt-1 text-xs font-medium uppercase text-slate-500">{product.sku}</p>
          </div>
          <span className="rounded-md bg-teal-50 px-2 py-1 text-sm font-semibold text-brand">{formatMoney(product.price)}</span>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{product.description ?? 'Business-ready inventory item.'}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500">{product.stockQuantity} in stock</span>
          <div className="flex gap-2">
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-field"
              onClick={() => onViewProduct(product)}
              type="button"
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
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
