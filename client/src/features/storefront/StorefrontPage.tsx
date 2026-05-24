import { useCallback, useEffect, useState } from 'react';
import type { CartItem, Product, StorefrontCustomer } from '../../models';
import type { ApiClient } from '../../services/apiClient';
import { CheckoutPage } from './CheckoutPage';
import { ProductCatalog } from './components/ProductCatalog';
import { StorefrontHeader } from './components/StorefrontHeader';
import { StorefrontHero } from './components/StorefrontHero';
import { addProductToCart, changeCartItemQuantity, emptyStorefrontCustomer, getCartTotals, hasValidStorefrontCustomer, toStorefrontOrderItems } from './helpers/storefrontCart';
import { applyStorefrontMetadata } from './helpers/storefrontSeo';

type StorefrontPageProps = {
  api: ApiClient;
  onSignIn: () => void;
};

export function StorefrontPage({ api, onSignIn }: StorefrontPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<StorefrontCustomer>(emptyStorefrontCustomer);
  const [status, setStatus] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    applyStorefrontMetadata();
  }, []);

  useEffect(() => {
    api.storefrontProducts(search).then(setProducts).catch(() => setProducts([]));
  }, [api, search]);

  const { subtotal, tax, total, itemCount } = getCartTotals(cart);

  function addToCart(product: Product) {
    setStatus('');
    setCart(current => addProductToCart(current, product));
  }

  function changeQuantity(productId: string, delta: number) {
    setCart(current => changeCartItemQuantity(current, productId, delta));
  }

  const checkoutItems = useCallback(() => toStorefrontOrderItems(cart), [cart]);

  const createPaymentIntent = useCallback(async (idempotencyKey: string) => {
    const canCreatePayment = cart.length > 0 && hasValidStorefrontCustomer(customer);
    if (!canCreatePayment) {
      setStatus('Enter customer details and add at least one product.');
      return null;
    }

    setStatus('');
    try {
      return await api.createStorefrontPaymentIntent({
        customer,
        items: checkoutItems(),
        idempotencyKey
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Stripe payment could not be initialized.');
      return null;
    }
  }, [api, cart.length, checkoutItems, customer]);

  async function placeOrder(paymentIntentId: string): Promise<string | null> {
    const canPlaceOrder = cart.length > 0 && hasValidStorefrontCustomer(customer) && !placing;
    if (!canPlaceOrder) {
      setStatus('Enter customer details and add at least one product.');
      return null;
    }

    setPlacing(true);
    setStatus('');
    try {
      const order = await api.placeStorefrontOrder({
        customer,
        items: checkoutItems(),
        paymentIntentId
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
    setCustomer(emptyStorefrontCustomer);
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
        onCreatePaymentIntent={createPaymentIntent}
        onPlaceOrder={placeOrder}
        onOrderConfirmed={handleOrderConfirmed}
      />
    );
  }

  return (
    <div className="min-h-screen bg-field text-ink">
      <StorefrontHeader onSignIn={onSignIn} />

      <main>
        <StorefrontHero productCount={products.length} cartCount={itemCount} total={total} canCheckout={cart.length > 0} onCheckout={() => setShowCheckout(true)} />
        <ProductCatalog products={products} search={search} onSearchChange={setSearch} onAddToCart={addToCart} />
      </main>
    </div>
  );
}
