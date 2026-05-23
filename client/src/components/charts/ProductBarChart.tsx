import { max, scaleBand, scaleLinear } from 'd3';
import type { ProductStockPoint } from '../../helpers/dashboardCharts';

type ProductBarChartProps = {
  data: ProductStockPoint[];
};

const width = 720;
const height = 280;
const margin = { top: 28, right: 24, bottom: 48, left: 42 };

export function ProductBarChart({ data }: ProductBarChartProps) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const xScale = scaleBand<string>()
    .domain(data.map(point => point.label))
    .range([margin.left, width - margin.right])
    .padding(0.28);

  const yMax = Math.max(1, max(data, point => point.value) ?? 1);
  const yScale = scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-amber-700 px-5 py-4 text-white">
        <p className="text-sm font-medium text-emerald-50">Inventory snapshot</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">Product stock levels</h2>
          <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-emerald-50">
            Top {data.length} SKUs
          </span>
        </div>
      </div>
      <div className="bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_34%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart showing product stock levels">
          <defs>
            <linearGradient id="product-bar-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="55%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id="product-bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#0f766e" floodOpacity="0.18" />
            </filter>
          </defs>

          {yScale.ticks(4).map(tick => (
            <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={margin.left - 12} y={yScale(tick) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{tick}</text>
            </g>
          ))}

          {data.map(point => {
            const x = xScale(point.label) ?? margin.left;
            const barWidth = xScale.bandwidth();
            const barHeight = height - margin.bottom - yScale(point.value);

            return (
              <g key={point.label}>
                <rect
                  x={x}
                  y={yScale(point.value)}
                  width={barWidth}
                  height={barHeight}
                  rx="10"
                  fill="url(#product-bar-gradient)"
                  filter="url(#product-bar-shadow)"
                />
                <text x={x + barWidth / 2} y={yScale(point.value) - 10} textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">
                  {point.value}
                </text>
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function EmptyChart() {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Product stock levels</h2>
      <p className="mt-4 text-sm text-slate-500">No product data is available yet.</p>
    </section>
  );
}
