import clsx from 'clsx';
import { CheckCircle2, Download } from 'lucide-react';
import { useState } from 'react';
import { downloadStorefrontInvoice, type StorefrontInvoice } from '../helpers/storefrontInvoice';

type OrderConfirmationDialogProps = {
  orderNumber: string;
  invoice?: StorefrontInvoice;
  onConfirm: () => void;
};

export function OrderConfirmationDialog({ orderNumber, invoice, onConfirm }: OrderConfirmationDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!orderNumber) return null;

  async function downloadInvoice() {
    if (!invoice) return;

    setDownloading(true);
    try {
      await downloadStorefrontInvoice(invoice);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 px-4 py-6">
      <section className="max-h-full w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl" role="dialog" aria-modal="true" aria-labelledby="order-confirmed-title">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 id="order-confirmed-title" className="mt-4 text-xl font-semibold">Order placed</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Order {orderNumber} has been placed successfully.
        </p>
        {invoice && (
          <button
            className="focus-ring mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={downloading}
            onClick={() => {
              void downloadInvoice();
            }}
            type="button"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing invoice' : 'Download invoice'}
          </button>
        )}
        <button
          className={clsx(
            'focus-ring min-h-11 w-full rounded-md border border-line px-4 py-2 font-semibold hover:bg-field',
            invoice ? 'mt-3' : 'mt-5'
          )}
          onClick={onConfirm}
          type="button"
        >
          OK
        </button>
      </section>
    </div>
  );
}
