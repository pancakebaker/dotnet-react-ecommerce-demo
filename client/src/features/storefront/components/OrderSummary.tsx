import { formatMoney } from '../../../helpers/format';

export function OrderSummary({ subtotal, tax, total }: { subtotal: number; tax: number; total: number }) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Tax</dt><dd>{formatMoney(tax)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
      </dl>
    </aside>
  );
}
