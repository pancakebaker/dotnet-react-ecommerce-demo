import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '../../helpers/format';
import type { CartItem, PaymentMethodId, StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../models';
import { checkoutSteps, getCheckoutStep, getFirstCheckoutStep, type CheckoutStepContext, type CheckoutStepId } from './checkout/checkoutSteps';
import { CheckoutProgress } from './components/CheckoutProgress';
import { OrderConfirmationDialog } from './components/OrderConfirmationDialog';
import { OrderSummary } from './components/OrderSummary';
import { hasValidStorefrontCustomer } from './helpers/storefrontCart';
import type { StorefrontInvoice } from './helpers/storefrontInvoice';

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
  onPreparePayment: (paymentMethod: PaymentMethodId, idempotencyKey: string) => Promise<StorefrontPaymentIntentResponse | null>;
  onPlaceOrder: (paymentMethod: PaymentMethodId, paymentIntentId?: string) => Promise<string | null>;
  onOrderConfirmed: () => void;
};

type OrderConfirmationState = {
  orderNumber: string;
  invoice?: StorefrontInvoice;
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
  onPreparePayment,
  onPlaceOrder,
  onOrderConfirmed
}: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStepId>(getFirstCheckoutStep().id);
  const [confirmation, setConfirmation] = useState<OrderConfirmationState | null>(null);
  const hasCartItems = cart.length > 0;
  const hasCustomerDetails = hasValidStorefrontCustomer(customer);
  const activeStep = getCheckoutStep(step);
  const activeStepIndex = checkoutSteps.findIndex(item => item.id === activeStep.id);

  function goToStep(nextStep: CheckoutStepId) {
    const descriptor = getCheckoutStep(nextStep);
    if (descriptor.canOpen(checkoutContext)) {
      setStep(descriptor.id);
    }
  }

  function goBack() {
    const previousStep = checkoutSteps[activeStepIndex - 1];
    if (previousStep) {
      setStep(previousStep.id);
    } else {
      onBackToStore();
    }
  }

  function goNext() {
    const nextStep = checkoutSteps[activeStepIndex + 1];
    if (nextStep?.canOpen(checkoutContext)) {
      setStep(nextStep.id);
    }
  }

  async function submitOrder(paymentMethod: PaymentMethodId, paymentIntentId?: string) {
    const orderNumber = await onPlaceOrder(paymentMethod, paymentIntentId);
    if (orderNumber) {
      setConfirmation({
        orderNumber,
        invoice: paymentMethod === 'cash_on_delivery'
          ? { orderNumber, customer, cart, subtotal, tax, total, paymentMethod }
          : undefined
      });
    }
  }

  const checkoutContext: CheckoutStepContext = {
    cart,
    customer,
    hasCartItems,
    hasCustomerDetails,
    placing,
    status,
    total,
    setCustomer,
    changeQuantity,
    onBackToStore,
    onPreparePayment,
    onSubmitOrder: submitOrder,
    goBack,
    goNext
  };

  return (
    <main className="min-h-screen bg-field text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button className="focus-ring flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 font-semibold" onClick={onBackToStore} type="button">
            <ShoppingCart className="h-5 w-5 text-brand" />
            <span className="truncate">Continue shopping</span>
          </button>
          <span className="flex-none text-sm font-semibold text-brand">{formatMoney(total)}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <CheckoutProgress
          activeStep={activeStep.id}
          canOpenStep={item => item.canOpen(checkoutContext)}
          onStepChange={goToStep}
          steps={checkoutSteps}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
            {activeStep.render(checkoutContext)}
          </section>

          <OrderSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>

      <OrderConfirmationDialog
        invoice={confirmation?.invoice}
        orderNumber={confirmation?.orderNumber ?? ''}
        onConfirm={onOrderConfirmed}
      />
    </main>
  );
}
