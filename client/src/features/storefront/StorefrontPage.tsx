import { useCallback, useEffect, useState } from 'react';
import type { PaymentMethodId, Product, StorefrontCustomer } from '../../models';
import type { ApiClient } from '../../services/apiClient';
import { CheckoutPage } from './CheckoutPage';
import { ProductDetailsPage } from './ProductDetailsPage';
import { ProductCatalog } from './components/ProductCatalog';
import { StorefrontHeader } from './components/StorefrontHeader';
import { StorefrontHero } from './components/StorefrontHero';
import { emptyStorefrontCustomer, hasValidStorefrontCustomer } from './helpers/storefrontCart';
import { productSlug } from './helpers/productSlugs';
import { useStorefrontCart } from './hooks/useStorefrontCart';
import { useStorefrontRouting } from './hooks/useStorefrontRouting';

type StorefrontPageProps = {
  api: ApiClient;
  onSignIn: () => void;
};

export function StorefrontPage({ api, onSignIn }: StorefrontPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState<StorefrontCustomer>(emptyStorefrontCustomer);
  const [status, setStatus] = useState('');
  const [placing, setPlacing] = useState(false);
  const { cart, totals, orderItems, hasCartItems, addProduct, changeQuantity, clearCart } = useStorefrontCart();
  const { route, viewProduct, backToProducts, openCheckout, closeCheckout, resetToHome } = useStorefrontRouting({ hasCartItems });

  useEffect(() => {
    api.storefrontProducts(search).then(setProducts).catch(() => setProducts([]));
  }, [api, search]);

  const { subtotal, tax, total, itemCount } = totals;

  function addToCart(product: Product) {
    setStatus('');
    addProduct(product);
  }

  const preparePayment = useCallback(async (paymentMethod: PaymentMethodId, idempotencyKey: string) => {
    const canCreatePayment = hasCartItems && hasValidStorefrontCustomer(customer);
    if (!canCreatePayment) {
      setStatus('Enter customer details and add at least one product.');
      return null;
    }

    setStatus('');
    try {
      return await api.prepareStorefrontPayment({
        customer,
        items: orderItems,
        idempotencyKey,
        paymentMethod
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Payment could not be initialized.');
      return null;
    }
  }, [api, customer, hasCartItems, orderItems]);

  async function placeOrder(paymentMethod: PaymentMethodId, paymentIntentId?: string): Promise<string | null> {
    const canPlaceOrder = hasCartItems && hasValidStorefrontCustomer(customer) && !placing;
    if (!canPlaceOrder) {
      setStatus('Enter customer details and add at least one product.');
      return null;
    }

    setPlacing(true);
    setStatus('');
    try {
      const order = await api.placeStorefrontOrder({
        customer,
        items: orderItems,
        paymentMethod,
        paymentIntentId: paymentMethod === 'card' ? paymentIntentId : undefined
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
    clearCart();
    setCustomer(emptyStorefrontCustomer);
    setStatus('');
    resetToHome();
  }

  if (route.view === 'checkout') {
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
        onBackToStore={closeCheckout}
        onPreparePayment={preparePayment}
        onPlaceOrder={placeOrder}
        onOrderConfirmed={handleOrderConfirmed}
      />
    );
  }

  const activeProduct = route.productSlug
    ? products.find(product => productSlug(product) === route.productSlug)
    : null;

  if (route.view === 'product' && activeProduct) {
    return (
      <ProductDetailsPage
        product={activeProduct}
        cartCount={itemCount}
        onAddToCart={addToCart}
        onBackToProducts={backToProducts}
        onCheckout={openCheckout}
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-field text-ink">
      <StorefrontHeader onHome={backToProducts} onSignIn={onSignIn} />

      <main>
        <StorefrontHero productCount={products.length} cartCount={itemCount} total={total} canCheckout={hasCartItems} onCheckout={openCheckout} />
        <ProductCatalog products={products} search={search} onSearchChange={setSearch} onAddToCart={addToCart} onViewProduct={viewProduct} />
      </main>
    </div>
  );
}
