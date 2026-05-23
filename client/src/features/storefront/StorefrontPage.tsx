import { useEffect, useState } from 'react';
import { Plus, Search, ShoppingCart, Store } from 'lucide-react';
import { formatMoney } from '../../helpers/format';
import { getProductImage } from '../../helpers/productImages';
import { isValidEmail, isValidPhone } from '../../helpers/validation';
import type { CartItem, Product, StorefrontCustomer } from '../../models';
import type { ApiClient } from '../../services/apiClient';
import { CheckoutPage } from './CheckoutPage';

type StorefrontPageProps = {
  api: ApiClient;
  onSignIn: () => void;
};

const emptyCustomer: StorefrontCustomer = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: ''
};

export function StorefrontPage({ api, onSignIn }: StorefrontPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<StorefrontCustomer>(emptyCustomer);
  const [status, setStatus] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    document.title = 'Ecommerce Demo Storefront - Business Ordering Demo';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', 'Ecommerce Demo storefront demo with product catalog, customer checkout, cart ordering, and a connected ASP.NET Core order management API.');
  }, []);

  useEffect(() => {
    api.storefrontProducts(search).then(setProducts).catch(() => setProducts([]));
  }, [api, search]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;
  function addToCart(product: Product) {
    setStatus('');
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) } : item);
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart(current => current
      .map(item => item.id === productId ? { ...item, quantity: Math.max(0, Math.min(item.stockQuantity, item.quantity + delta)) } : item)
      .filter(item => item.quantity > 0));
  }

  async function placeOrder(): Promise<string | null> {
    const canPlaceOrder = cart.length > 0 && Boolean(customer.name.trim()) && isValidEmail(customer.email) && isValidPhone(customer.phone) && !placing;
    if (!canPlaceOrder) {
      setStatus('Enter customer details and add at least one product.');
      return null;
    }

    setPlacing(true);
    setStatus('');
    try {
      const order = await api.placeStorefrontOrder({
        customer,
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity }))
      });
      return order.orderNumber;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Order could not be placed. Please check the details and try again.');
      return null;
    } finally {
      setPlacing(false);
    }
  }

  function handleOrderConfirmed() {
    setCart([]);
    setCustomer(emptyCustomer);
    setStatus('');
    setShowCheckout(false);
  }

  if (showCheckout) {
    return (
      <CheckoutPage
        cart={cart}
        customer={customer}
        subtotal={subtotal}
        tax={tax}
        total={total}
        placing={placing}
        status={status}
        setCustomer={setCustomer}
        changeQuantity={changeQuantity}
        onBackToStore={() => setShowCheckout(false)}
        onPlaceOrder={placeOrder}
        onOrderConfirmed={handleOrderConfirmed}
      />
    );
  }

  return (
    <div className="min-h-screen bg-field text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold" aria-label="Ecommerce Demo storefront home">
            <Store className="h-5 w-5 text-brand" />
            Ecommerce Demo
          </a>
          <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm hover:bg-field" onClick={onSignIn}>
            Staff sign in
          </button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-line bg-white">
          <picture className="absolute inset-0 h-full w-full">
            <source
              type="image/webp"
              media="(min-width: 1024px)"
              srcSet="/images/ecommerce-demo-storefront-hero-1280.webp 1280w, /images/ecommerce-demo-storefront-hero.webp 1983w"
              sizes="100vw"
            />
            <source
              media="(min-width: 1024px)"
              srcSet="/images/ecommerce-demo-storefront-hero-1280.jpg 1280w, /images/ecommerce-demo-storefront-hero.jpg 1983w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              media="(min-width: 640px)"
              srcSet="/images/ecommerce-demo-storefront-hero-720.webp 720w, /images/ecommerce-demo-storefront-hero-1280.webp 1280w"
              sizes="100vw"
            />
            <source
              media="(min-width: 640px)"
              srcSet="/images/ecommerce-demo-storefront-hero-720.jpg 720w, /images/ecommerce-demo-storefront-hero-1280.jpg 1280w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              srcSet="/images/ecommerce-demo-storefront-hero-720.webp"
              sizes="100vw"
            />
            <img
              src="/images/ecommerce-demo-storefront-hero-720.jpg"
              alt="Small business order management workspace with packaged products, scanner, printer, and inventory labels"
              className="h-full w-full object-cover"
              width="720"
              height="288"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/45" />
          <div className="relative mx-auto grid min-h-[300px] max-w-7xl gap-6 px-4 py-8 sm:px-6 md:min-h-[380px] lg:min-h-[430px] lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-14">
            <div>
              <p className="text-sm font-semibold uppercase text-brand">Small business order management</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Order products online and send them straight into Ecommerce Demo.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                Browse active inventory, add products to a cart, enter customer details, and submit a real order to the ASP.NET Core API.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white/85 p-5 shadow-sm backdrop-blur">
              <dl className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Products</dt>
                  <dd className="mt-2 text-2xl font-semibold">{products.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Cart</dt>
                  <dd className="mt-2 text-2xl font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Total</dt>
                  <dd className="mt-2 text-2xl font-semibold">{formatMoney(total)}</dd>
                </div>
              </dl>
              <button
                className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={cart.length === 0}
                onClick={() => setShowCheckout(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                Checkout
              </button>
            </div>
          </div>
        </section>

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
                  onChange={event => setSearch(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const image = getProductImage(product.sku, product.name);

                return (
                  <article key={product.id} className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
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
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
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
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">{product.stockQuantity} in stock</span>
                        <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-teal-800" onClick={() => addToCart(product)}>
                          <Plus className="h-4 w-4" />
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
