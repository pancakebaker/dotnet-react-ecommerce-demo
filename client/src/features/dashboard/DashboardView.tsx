import { useEffect, useState } from 'react';
import { OrdersLineChart } from '../../components/charts/OrdersLineChart';
import { ProductBarChart } from '../../components/charts/ProductBarChart';
import { LoadingState } from '../../components/LoadingState';
import { StatCard } from '../../components/StatCard';
import { buildOrdersTrend, buildProductStock } from '../../helpers/dashboardCharts';
import { formatMoney } from '../../helpers/format';
import type { OrdersTrendPoint, ProductStockPoint } from '../../helpers/dashboardCharts';
import type { DashboardSummary } from '../../models';
import type { ApiClient } from '../../services/apiClient';

type DashboardViewProps = {
  api: ApiClient;
};

type DashboardData = {
  summary: DashboardSummary;
  ordersTrend: OrdersTrendPoint[];
  productStock: ProductStockPoint[];
};

export function DashboardView({ api }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      api.dashboard(),
      api.orders(),
      api.products()
    ])
      .then(([summary, orders, products]) => {
        setData({
          summary,
          ordersTrend: buildOrdersTrend(orders.items),
          productStock: buildProductStock(products.items)
        });
      })
      .catch(() => setData(null));
  }, [api]);

  if (!data) return <LoadingState />;

  const { summary, ordersTrend, productStock } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Customers" value={summary.totalCustomers} />
        <StatCard label="Orders" value={summary.totalOrders} />
        <StatCard label="Pending" value={summary.pendingOrders} />
        <StatCard label="Completed" value={summary.completedOrders} />
        <StatCard label="Revenue" value={formatMoney(summary.monthlyRevenue)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <OrdersLineChart data={ordersTrend} />
        <ProductBarChart data={productStock} />
      </div>
      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3 font-semibold">Recent activity</div>
        <div className="divide-y divide-line">
          {summary.recentActivity.map(item => (
            <div key={`${item.entityId}-${item.createdAt}`} className="px-4 py-3">
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-xs text-slate-500">{item.entityType} - {item.action}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
