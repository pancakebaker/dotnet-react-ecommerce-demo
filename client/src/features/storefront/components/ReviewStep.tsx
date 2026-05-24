import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '../../../helpers/format';
import type { CartItem, StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../../models';
import { getPaymentFingerprint } from '../helpers/storefrontCart';
import { StripePaymentForm } from './StripePaymentForm';

type ReviewStepProps = {
  cart: CartItem[];
  customer: StorefrontCustomer;
  placing: boolean;
  canPlaceOrder: boolean;
  status: string;
  total: number;
  onBack: () => void;
  onCreatePaymentIntent: (idempotencyKey: string) => Promise<StorefrontPaymentIntentResponse | null>;
  onPlaceOrder: (paymentIntentId: string) => Promise<void>;
};

declare global {
  interface Window {
    __ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__?: string;
  }
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export function ReviewStep({
  cart,
  customer,
  placing,
  canPlaceOrder,
  status,
  total,
  onBack,
  onCreatePaymentIntent,
  onPlaceOrder
}: ReviewStepProps) {
  const [paymentIntent, setPaymentIntent] = useState<StorefrontPaymentIntentResponse | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [initializingPayment, setInitializingPayment] = useState(false);
  const amountLabel = formatMoney(total);
  const paymentFingerprint = useMemo(() => getPaymentFingerprint(cart, customer, total), [cart, customer, total]);

  useEffect(() => {
    if (!canPlaceOrder || !stripePublishableKey || window.__ECOMMERCE_DEMO_SCREENSHOTS__) {
      setPaymentIntent(null);
      return;
    }

    let active = true;
    setInitializingPayment(true);
    setPaymentError('');
    setPaymentIntent(null);

    onCreatePaymentIntent(crypto.randomUUID())
      .then(intent => {
        if (!active) return;
        setPaymentIntent(intent);
        if (!intent) {
          setPaymentError('Stripe payment could not be initialized.');
        }
      })
      .catch(error => {
        if (!active) return;
        setPaymentError(error instanceof Error ? error.message : 'Stripe payment could not be initialized.');
      })
      .finally(() => {
        if (active) setInitializingPayment(false);
      });

    return () => {
      active = false;
    };
  }, [canPlaceOrder, onCreatePaymentIntent, paymentFingerprint]);

  const stripeOptions = useMemo(() => {
    if (!paymentIntent?.clientSecret) return undefined;

    return {
      clientSecret: paymentIntent.clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          borderRadius: '6px',
          colorPrimary: '#0f766e'
        }
      }
    };
  }, [paymentIntent?.clientSecret]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Place order</h1>
      <div className="mt-5 grid gap-4">
        <ReviewCustomer customer={customer} />
        <ReviewItems cart={cart} />
        <section className="rounded-md border border-line p-4">
          <h2 className="font-semibold">Secure payment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Card details are collected by Stripe Elements. The API verifies the PaymentIntent before creating the order.
          </p>

          <div className="mt-4">
            {window.__ECOMMERCE_DEMO_SCREENSHOTS__ && (
              <div className="rounded-md bg-teal-50 p-4 text-sm font-medium text-brand">
                Stripe Payment Element ready
              </div>
            )}

            {!window.__ECOMMERCE_DEMO_SCREENSHOTS__ && !stripePublishableKey && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to <code>client/.env</code> and configure <code>Stripe__SecretKey</code> for the API to enable Stripe payments.
              </div>
            )}

            {!window.__ECOMMERCE_DEMO_SCREENSHOTS__ && stripePublishableKey && initializingPayment && (
              <div className="space-y-3">
                <div className="h-10 animate-pulse rounded-md bg-slate-100" />
                <div className="h-24 animate-pulse rounded-md bg-slate-100" />
                <div className="h-10 animate-pulse rounded-md bg-slate-100" />
              </div>
            )}

            {!window.__ECOMMERCE_DEMO_SCREENSHOTS__ && paymentError && (
              <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{paymentError}</p>
            )}

            {!window.__ECOMMERCE_DEMO_SCREENSHOTS__ && window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__ && (
              <button
                className="focus-ring w-full rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={placing}
                onClick={() => {
                  void onPlaceOrder(window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__ ?? '');
                }}
              >
                {placing ? 'Placing order' : 'Place order'}
              </button>
            )}

            {!window.__ECOMMERCE_DEMO_SCREENSHOTS__ && stripePromise && stripeOptions && paymentIntent && (
              <Elements key={paymentIntent.clientSecret} stripe={stripePromise} options={stripeOptions}>
                <StripePaymentForm
                  amountLabel={amountLabel}
                  placing={placing}
                  customerEmail={customer.email}
                  onPaymentResult={async (paymentIntentId, paymentStatus) => {
                    if (!paymentIntentId) return;

                    if (paymentStatus === 'succeeded') {
                      await onPlaceOrder(paymentIntentId);
                      return;
                    }

                    setPaymentError(`Payment status: ${paymentStatus ?? 'unknown'}. Order was not created yet.`);
                  }}
                />
              </Elements>
            )}
          </div>
        </section>
      </div>
      {status && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{status}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="focus-ring rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBack}>
          Back to customer details
        </button>
      </div>
    </div>
  );
}

function ReviewCustomer({ customer }: { customer: StorefrontCustomer }) {
  return (
    <section className="rounded-md border border-line p-4">
      <h2 className="font-semibold">Customer</h2>
      <p className="mt-2 text-sm text-slate-700">{customer.name}</p>
      <p className="text-sm text-slate-500">{customer.companyName || 'No company'} - {customer.email}</p>
      {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
      {customer.address && <p className="text-sm text-slate-500">{customer.address}</p>}
    </section>
  );
}

function ReviewItems({ cart }: { cart: CartItem[] }) {
  return (
    <section className="rounded-md border border-line p-4">
      <h2 className="font-semibold">Items</h2>
      <div className="mt-3 space-y-2">
        {cart.map(item => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <span>{item.quantity} x {item.name}</span>
            <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
