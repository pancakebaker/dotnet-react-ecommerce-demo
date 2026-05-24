import { ShoppingCart } from 'lucide-react';
import { formatMoney } from '../../../helpers/format';

type StorefrontHeroProps = {
  productCount: number;
  cartCount: number;
  total: number;
  canCheckout: boolean;
  onCheckout: () => void;
};

export function StorefrontHero({ productCount, cartCount, total, canCheckout, onCheckout }: StorefrontHeroProps) {
  return (
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
        <source type="image/webp" srcSet="/images/ecommerce-demo-storefront-hero-720.webp" sizes="100vw" />
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
              <dd className="mt-2 text-2xl font-semibold">{productCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Cart</dt>
              <dd className="mt-2 text-2xl font-semibold">{cartCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Total</dt>
              <dd className="mt-2 text-2xl font-semibold">{formatMoney(total)}</dd>
            </div>
          </dl>
          <button
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!canCheckout}
            onClick={onCheckout}
          >
            <ShoppingCart className="h-4 w-4" />
            Checkout
          </button>
        </div>
      </div>
    </section>
  );
}
