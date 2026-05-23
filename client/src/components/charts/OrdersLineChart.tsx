import { area, curveMonotoneX, line, max, scaleLinear, scalePoint } from 'd3';
import type { OrdersTrendPoint } from '../../helpers/dashboardCharts';
import { formatMoney } from '../../helpers/format';

type OrdersLineChartProps = {
  data: OrdersTrendPoint[];
};

const width = 720;
const height = 280;
const margin = { top: 26, right: 32, bottom: 44, left: 44 };

export function OrdersLineChart({ data }: OrdersLineChartProps) {
  if (data.length === 0) {
    return <EmptyChart title="Orders trend" />;
  }

  const xScale = scalePoint<string>()
    .domain(data.map(point => point.label))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const yMax = Math.max(1, max(data, point => point.orders) ?? 1);
  const yScale = scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const pathLine = line<OrdersTrendPoint>()
    .x(point => xScale(point.label) ?? margin.left)
    .y(point => yScale(point.orders))
    .curve(curveMonotoneX)(data);

  const pathArea = area<OrdersTrendPoint>()
    .x(point => xScale(point.label) ?? margin.left)
    .y0(height - margin.bottom)
    .y1(point => yScale(point.orders))
    .curve(curveMonotoneX)(data);

  const tickValues = yMax <= 4
    ? Array.from({ length: yMax + 1 }, (_, index) => index)
    : yScale.ticks(4);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-sky-900 px-5 py-4 text-white">
        <p className="text-sm font-medium text-teal-100">Order momentum</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">Orders over time</h2>
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-teal-50">
            {formatMoney(data.reduce((sum, point) => sum + point.revenue, 0))} revenue
          </span>
        </div>
      </div>
      <div className="bg-gradient-to-b from-white to-slate-50 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Line chart showing orders over time">
          <defs>
            <linearGradient id="orders-line-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="55%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="orders-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {tickValues.map(tick => (
            <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={margin.left - 12} y={yScale(tick) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{tick}</text>
            </g>
          ))}

          {pathArea && <path d={pathArea} fill="url(#orders-area-gradient)" />}
          {pathLine && <path d={pathLine} fill="none" stroke="url(#orders-line-gradient)" strokeLinecap="round" strokeWidth="4" />}

          {data.map(point => {
            const x = xScale(point.label) ?? margin.left;
            const y = yScale(point.orders);

            return (
              <g key={point.label}>
                <circle cx={x} cy={y} r="7" fill="#ffffff" stroke="#14b8a6" strokeWidth="4" />
                <text x={x} y={height - 18} textAnchor="middle" className="fill-slate-500 text-[11px]">{point.label}</text>
                <text x={x} y={y - 14} textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">{point.orders}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-4 text-sm text-slate-500">No order data is available yet.</p>
    </section>
  );
}
