import { CheckCircle2 } from 'lucide-react';

type OrderConfirmationDialogProps = {
  orderNumber: string;
  onConfirm: () => void;
};

export function OrderConfirmationDialog({ orderNumber, onConfirm }: OrderConfirmationDialogProps) {
  if (!orderNumber) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl" role="dialog" aria-modal="true" aria-labelledby="order-confirmed-title">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 id="order-confirmed-title" className="mt-4 text-xl font-semibold">Order placed</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Order {orderNumber} has been placed successfully.
        </p>
        <button className="focus-ring mt-5 w-full rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800" onClick={onConfirm}>
          OK
        </button>
      </section>
    </div>
  );
}
