import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '../../helpers/format';
import type { CartItem, StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../models';
import { CartStep } from './components/CartStep';
import { CheckoutProgress } from './components/CheckoutProgress';
import { CustomerStep } from './components/CustomerStep';
import { OrderConfirmationDialog } from './components/OrderConfirmationDialog';
import { OrderSummary } from './components/OrderSummary';
import { ReviewStep } from './components/ReviewStep';
import type { CheckoutStep } from './components/checkoutTypes';
import { hasValidStorefrontCustomer } from './helpers/storefrontCart';

type CheckoutPageProps = {
  cart: CartItem[];
  customer: StorefrontCustomer;
  subtotal: number;
  tax: number;
  total: number;
  placing: boolean;
  status: string;
  setCustomer: (updater: (current: StorefrontCustomer) => StorefrontCustomer) => void;
  changeQuantity: (productId: string, delta: number) => void;
  onBackToStore: () => void;
  onCreatePaymentIntent: (idempotencyKey: string) => Promise<StorefrontPaymentIntentResponse | null>;
  onPlaceOrder: (paymentIntentId: string) => Promise<string | null>;
  onOrderConfirmed: () => void;
};

export function CheckoutPage({
  cart,
  customer,
  subtotal,
  tax,
  total,
  placing,
  status,
  setCustomer,
  changeQuantity,
  onBackToStore,
  onCreatePaymentIntent,
  onPlaceOrder,
  onOrderConfirmed
}: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const hasCartItems = cart.length > 0;
  const hasCustomerDetails = hasValidStorefrontCustomer(customer);

  function canOpenStep(nextStep: CheckoutStep) {
    if (nextStep === 'cart') return true;
    if (nextStep === 'customer') return hasCartItems;
    return hasCartItems && hasCustomerDetails;
  }

  async function submitOrder(paymentIntentId: string) {
    const orderNumber = await onPlaceOrder(paymentIntentId);
    if (orderNumber) {
      setConfirmedOrderNumber(orderNumber);
    }
  }

  return (
    <main className="min-h-screen bg-field text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button className="focus-ring flex items-center gap-2 font-semibold" onClick={onBackToStore}>
            <ShoppingCart className="h-5 w-5 text-brand" />
            Continue shopping
          </button>
          <span className="text-sm font-semibold text-brand">{formatMoney(total)}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <CheckoutProgress activeStep={step} canOpenStep={canOpenStep} onStepChange={setStep} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            {step === 'cart' && (
              <CartStep
                cart={cart}
                changeQuantity={changeQuantity}
                onBackToStore={onBackToStore}
                onNext={() => setStep('customer')}
              />
            )}
            {step === 'customer' && (
              <CustomerStep
                customer={customer}
                canContinue={hasCustomerDetails}
                setCustomer={setCustomer}
                onBack={() => setStep('cart')}
                onNext={() => setStep('review')}
              />
            )}
            {step === 'review' && (
              <ReviewStep
                cart={cart}
                customer={customer}
                placing={placing}
                canPlaceOrder={hasCartItems && hasCustomerDetails && !placing}
                status={status}
                total={total}
                onBack={() => setStep('customer')}
                onCreatePaymentIntent={onCreatePaymentIntent}
                onPlaceOrder={submitOrder}
              />
            )}
          </section>

          <OrderSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>

      <OrderConfirmationDialog orderNumber={confirmedOrderNumber} onConfirm={onOrderConfirmed} />
    </main>
  );
}
