import { Download, Truck } from 'lucide-react';

type CashOnDeliveryPanelProps = {
  amountLabel: string;
  placing: boolean;
  onPlaceOrder: () => Promise<void>;
};

export function CashOnDeliveryPanel({ amountLabel, placing, onPlaceOrder }: CashOnDeliveryPanelProps) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-emerald-950">Pay when your order arrives.</p>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            No card details are needed now. After placing the order, download the invoice and keep it for delivery.
          </p>
        </div>
      </div>
      <button
        className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={placing}
        onClick={() => {
          void onPlaceOrder();
        }}
        type="button"
      >
        <Download className="h-4 w-4" />
        {placing ? 'Placing order' : `Place order for ${amountLabel}`}
      </button>
    </div>
  );
}
