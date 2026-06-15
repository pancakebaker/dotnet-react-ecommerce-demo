import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import type { StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../../models';
import { StripePaymentForm } from './StripePaymentForm';

type CardPaymentPanelProps = {
  amountLabel: string;
  customer: StorefrontCustomer;
  initializingPayment: boolean;
  paymentError: string;
  paymentIntent: StorefrontPaymentIntentResponse | null;
  placing: boolean;
  onPlaceOrder: (paymentIntentId?: string) => Promise<void>;
  onPaymentError: (message: string) => void;
};

declare global {
  interface Window {
    __ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__?: string;
    __ECOMMERCE_DEMO_SCREENSHOTS__?: boolean;
  }
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const paymentIntentClientSecretPattern = /^pi_[^_]+_secret_/;
let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise() {
  if (!stripePublishableKey) return null;

  stripePromise ??= loadStripe(stripePublishableKey);
  return stripePromise;
}

export function CardPaymentPanel({
  amountLabel,
  customer,
  initializingPayment,
  paymentError,
  paymentIntent,
  placing,
  onPlaceOrder,
  onPaymentError
}: CardPaymentPanelProps) {
  const stripeOptions = useMemo(() => {
    const clientSecret = paymentIntent?.clientSecret ?? '';
    if (!paymentIntentClientSecretPattern.test(clientSecret)) return undefined;

    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          borderRadius: '6px',
          colorPrimary: '#0f766e'
        }
      }
    };
  }, [paymentIntent?.clientSecret]);
  const stripe = paymentIntent && stripeOptions ? getStripePromise() : null;

  if (window.__ECOMMERCE_DEMO_SCREENSHOTS__) {
    return (
      <div className="rounded-md bg-teal-50 p-4 text-sm font-medium text-brand">
        Stripe Payment Element ready
      </div>
    );
  }

  if (window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__) {
    return (
      <div className="space-y-4">
        <button
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={placing}
          onClick={() => {
            void onPlaceOrder(window.__ECOMMERCE_DEMO_E2E_PAYMENT_INTENT_ID__);
          }}
          type="button"
        >
          <CreditCard className="h-4 w-4" />
          {placing ? 'Placing order' : 'Place order'}
        </button>
      </div>
    );
  }

  if (!stripePublishableKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
        Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to <code>client/.env</code> and configure <code>Stripe__SecretKey</code> for the API to enable card payments.
      </div>
    );
  }

  if (initializingPayment) {
    return (
      <div className="space-y-3" aria-label="Preparing card payment">
        <div className="h-10 animate-pulse rounded-md bg-slate-100" />
        <div className="h-24 animate-pulse rounded-md bg-slate-100" />
        <div className="h-10 animate-pulse rounded-md bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentError && (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{paymentError}</p>
      )}
      {paymentIntent && !stripeOptions && (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          Payment could not be initialized. Please refresh and try again.
        </p>
      )}

      {stripe && stripeOptions && paymentIntent && (
        <Elements key={paymentIntent.clientSecret} stripe={stripe} options={stripeOptions}>
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

              onPaymentError(`Payment status: ${paymentStatus ?? 'unknown'}. Order was not created yet.`);
            }}
          />
        </Elements>
      )}
    </div>
  );
}
