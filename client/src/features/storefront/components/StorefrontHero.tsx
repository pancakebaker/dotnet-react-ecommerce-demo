import { ShoppingCart } from 'lucide-react';
import { formatMoney } from '../../../helpers/format';
import { CommerceHero } from './CommerceHero';

type StorefrontHeroProps = {
  productCount: number;
  cartCount: number;
  total: number;
  canCheckout: boolean;
  onCheckout: () => void;
};

export function StorefrontHero({ productCount, cartCount, total, canCheckout, onCheckout }: StorefrontHeroProps) {
  return (
    <CommerceHero
      eyebrow="Small business order management"
      title="Order products online and send them straight into Ecommerce Demo."
      description="Browse active inventory, add products to a cart, enter customer details, and submit a real order to the ASP.NET Core API."
      background={{
        src: '/images/ecommerce-demo-storefront-hero-720.jpg',
        srcSet: '/images/ecommerce-demo-storefront-hero-720.jpg 720w, /images/ecommerce-demo-storefront-hero-1280.jpg 1280w, /images/ecommerce-demo-storefront-hero.jpg 1983w',
        webpSrcSet: '/images/ecommerce-demo-storefront-hero-720.webp 720w, /images/ecommerce-demo-storefront-hero-1280.webp 1280w, /images/ecommerce-demo-storefront-hero.webp 1983w',
        alt: 'Small business order management workspace with packaged products, scanner, printer, and inventory labels'
      }}
      actions={[
        {
          label: 'Checkout',
          onClick: onCheckout,
          icon: <ShoppingCart className="h-4 w-4" />,
          disabled: !canCheckout
        }
      ]}
      stats={[
        { label: 'Products', value: productCount.toString() },
        { label: 'Cart', value: cartCount.toString() },
        { label: 'Total', value: formatMoney(total) }
      ]}
    />
  );
}
