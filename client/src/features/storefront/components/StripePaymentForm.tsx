import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { FormEvent } from 'react';
import { useState } from 'react';

type StripePaymentFormProps = {
  amountLabel: string;
  placing: boolean;
  customerEmail: string;
  onPaymentResult?: (paymentIntentId: string | null, status: string | null) => void;
};

export function StripePaymentForm({ amountLabel, placing, customerEmail, onPaymentResult }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!stripe || !elements) return;

    setSubmitting(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
          payment_method_data: {
            billing_details: {
              email: customerEmail || undefined,
            },
          },
        },
        redirect: "if_required",
      });

      if (result.error) {
        setMessage(result.error.message ?? 'Payment could not be confirmed. Please check your card details and try again.');
        onPaymentResult?.(null, "payment_failed");
      } else {
        const status = result.paymentIntent?.status ?? "processing";
        setMessage(
          status === "succeeded"
            ? "Payment confirmed. Creating your order..."
            : `Payment status: ${status}`
        );
        onPaymentResult?.(result.paymentIntent?.id ?? null, status);
      }
    } catch (error) {
      setMessage('Payment could not be completed. Please try again.');
      onPaymentResult?.(null, "payment_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submitPayment}>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
          Payment details
        </label>
        <PaymentElement />
      </div>
      <button
        className="focus-ring w-full rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!stripe || !elements || submitting || placing}
        aria-busy={submitting || placing}
        type="submit"
      >
        {submitting || placing ? "Processing..." : `Pay ${amountLabel} and place order`}
      </button>
      {message && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800" role="status">{message}</p>}
    </form>
  );
}
