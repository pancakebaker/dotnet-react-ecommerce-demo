import { Minus, Plus } from 'lucide-react';
import { formatMoney } from '../../../helpers/format';
import type { CartItem } from '../../../models';

type CartStepProps = {
  cart: CartItem[];
  changeQuantity: (productId: string, delta: number) => void;
  onBackToStore: () => void;
  onNext: () => void;
};

export function CartStep({ cart, changeQuantity, onBackToStore, onNext }: CartStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Review your cart</h1>
      <div className="mt-5 space-y-3">
        {cart.length === 0 && <p className="rounded-md bg-field p-4 text-sm text-slate-500">Your cart is empty.</p>}
        {cart.map(item => (
          <div key={item.id} className="flex flex-col gap-3 rounded-md border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.sku} - {formatMoney(item.price)} each</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-2" role="group" aria-label={`${item.name} quantity`}>
                <button className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-line hover:bg-field" onClick={() => changeQuantity(item.id, -1)} title="Decrease quantity" aria-label={`Decrease ${item.name} quantity`} type="button">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{item.quantity}</span>
                <button className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-line hover:bg-field" onClick={() => changeQuantity(item.id, 1)} title="Increase quantity" aria-label={`Increase ${item.name} quantity`} type="button">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="font-semibold">{formatMoney(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="focus-ring min-h-11 rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBackToStore} type="button">
          Add more products
        </button>
        <button className="focus-ring min-h-11 rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={cart.length === 0} onClick={onNext} type="button">
          Continue to customer details
        </button>
      </div>
    </div>
  );
}
