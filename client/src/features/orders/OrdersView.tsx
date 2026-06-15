import { useEffect, useState } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { downloadOrdersCsv } from '../../helpers/exports';
import { formatMoney } from '../../helpers/format';
import type { Order, OrderStatus, PagedResult, Role } from '../../models';
import { canAccess, canEditField } from '../../permissions/permissions';
import type { ApiClient } from '../../services/apiClient';

type OrdersViewProps = {
  api: ApiClient;
  role: Role;
};

const nextStatuses: OrderStatus[] = ['Processing', 'Completed', 'Cancelled'];
const filterStatuses: OrderStatus[] = ['Draft', 'Submitted', 'Processing', 'Completed', 'Cancelled'];

const statusStyles: Record<OrderStatus, { badge: string; dot: string; card: string }> = {
  Draft: {
    badge: 'border-slate-300 bg-slate-50 text-slate-700',
    dot: 'bg-slate-400',
    card: 'border-l-slate-400'
  },
  Submitted: {
    badge: 'border-sky-300 bg-sky-50 text-sky-800',
    dot: 'bg-sky-500',
    card: 'border-l-sky-500'
  },
  Processing: {
    badge: 'border-amber-300 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
    card: 'border-l-amber-500'
  },
  Completed: {
    badge: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
    card: 'border-l-emerald-500'
  },
  Cancelled: {
    badge: 'border-rose-300 bg-rose-50 text-rose-800',
    dot: 'bg-rose-500',
    card: 'border-l-rose-500'
  }
};

export function OrdersView({ api, role }: OrdersViewProps) {
  const [orders, setOrders] = useState<PagedResult<Order> | null>(null);
  const [status, setStatus] = useState('');
  const canExportOrders = canAccess(role, 'orders', 'export');
  const canUpdateOrderStatus = canEditField(role, 'orders', 'status');

  async function refresh(nextStatus = status) {
    setOrders(await api.orders(nextStatus));
  }

  useEffect(() => {
    refresh('').catch(() => setOrders(null));
  }, []);

  async function update(id: string, nextStatus: OrderStatus) {
    await api.updateOrderStatus(id, nextStatus);
    await refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          className="focus-ring rounded-md border border-line bg-white px-3 py-2"
          value={status}
          onChange={event => {
            setStatus(event.target.value);
            refresh(event.target.value);
          }}
        >
          <option value="">All statuses</option>
          {filterStatuses.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        {canExportOrders && (
          <button
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
            disabled={(orders?.items.length ?? 0) === 0}
            onClick={() => downloadOrdersCsv(orders?.items ?? [])}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        )}
      </div>
      <div className="grid gap-4">
        {(orders?.items ?? []).map(order => {
          const style = statusStyles[order.status];

          return (
            <article key={order.id} className={`rounded-lg border border-l-4 border-line bg-white p-4 shadow-sm ${style.card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{order.orderNumber}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{order.customerName}</span>
                    <span aria-hidden="true">-</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-lg font-semibold">{formatMoney(order.total)}</div>
              </div>
              {canUpdateOrderStatus && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextStatuses.filter(next => canAccess(role, 'orders', actionForStatus(next))).map(next => (
                    <button
                      key={next}
                      className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-field"
                      onClick={() => update(order.id, next)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {next}
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function actionForStatus(status: OrderStatus) {
  if (status === 'Cancelled') return 'cancel';
  if (status === 'Completed') return 'approve';
  return 'update';
}
