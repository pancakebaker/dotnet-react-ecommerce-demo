import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '../../../helpers/format';
import type { CartItem, PaymentMethodId, StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../../models';
import { getPaymentFingerprint } from '../helpers/storefrontCart';
import { getPaymentMethod, paymentMethods } from '../payments/paymentMethods';

type ReviewStepProps = {
  cart: CartItem[];
  customer: StorefrontCustomer;
  placing: boolean;
  canPlaceOrder: boolean;
  status: string;
  total: number;
  onBack: () => void;
  onPreparePayment: (paymentMethod: PaymentMethodId, idempotencyKey: string) => Promise<StorefrontPaymentIntentResponse | null>;
  onPlaceOrder: (paymentMethod: PaymentMethodId, paymentReferenceId?: string) => Promise<void>;
};

declare global {
  interface Window {
    __ECOMMERCE_DEMO_SCREENSHOTS__?: boolean;
  }
}

export function ReviewStep({
  cart,
  customer,
  placing,
  canPlaceOrder,
  status,
  total,
  onBack,
  onPreparePayment,
  onPlaceOrder
}: ReviewStepProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('card');
  const [paymentIntent, setPaymentIntent] = useState<StorefrontPaymentIntentResponse | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [initializingPayment, setInitializingPayment] = useState(false);
  const amountLabel = formatMoney(total);
  const paymentFingerprint = useMemo(() => getPaymentFingerprint(cart, customer, total), [cart, customer, total]);
  const paymentMethod = getPaymentMethod(selectedPaymentMethod);

  useEffect(() => {
    if (!canPlaceOrder || !paymentMethod.requiresPreparation || window.__ECOMMERCE_DEMO_SCREENSHOTS__) {
      setPaymentIntent(null);
      setPaymentError('');
      return;
    }

    let active = true;
    setInitializingPayment(true);
    setPaymentError('');
    setPaymentIntent(null);

    onPreparePayment(paymentMethod.id, crypto.randomUUID())
      .then(intent => {
        if (!active) return;
        setPaymentIntent(intent);
        if (!intent) {
          setPaymentError('Payment could not be initialized.');
        }
      })
      .catch(error => {
        if (!active) return;
        setPaymentError(error instanceof Error ? error.message : 'Payment could not be initialized.');
      })
      .finally(() => {
        if (active) setInitializingPayment(false);
      });

    return () => {
      active = false;
    };
  }, [canPlaceOrder, onPreparePayment, paymentFingerprint, paymentMethod.id, paymentMethod.requiresPreparation]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Place order</h1>
      <div className="mt-5 grid gap-4">
        <ReviewCustomer customer={customer} />
        <ReviewItems cart={cart} />
        <section className="rounded-md border border-line p-4">
          <h2 className="font-semibold">Payment method</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map(method => {
              const isSelected = method.id === selectedPaymentMethod;
              return (
                <label
                  className={`flex min-h-28 cursor-pointer gap-3 rounded-md border p-4 transition ${
                    isSelected ? 'border-brand bg-teal-50 ring-2 ring-brand/20' : 'border-line bg-white hover:bg-field'
                  }`}
                  key={method.id}
                >
                  <input
                    checked={isSelected}
                    className="mt-1 h-4 w-4 accent-brand"
                    name="paymentMethod"
                    onChange={() => setSelectedPaymentMethod(method.id)}
                    type="radio"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{method.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{method.summary}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4">
            {paymentMethod.render({
              amountLabel,
              customer,
              initializingPayment,
              paymentError,
              paymentIntent,
              placing,
              onPaymentError: setPaymentError,
              onPlaceOrder: paymentReferenceId => onPlaceOrder(paymentMethod.id, paymentReferenceId)
            })}
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
