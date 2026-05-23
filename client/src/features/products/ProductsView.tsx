import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Toolbar } from '../../components/Toolbar';
import { downloadProductsPdf } from '../../helpers/exports';
import { formatMoney } from '../../helpers/format';
import type { PagedResult, Product } from '../../models';
import type { ApiClient } from '../../services/apiClient';

type ProductsViewProps = {
  api: ApiClient;
};

export function ProductsView({ api }: ProductsViewProps) {
  const [products, setProducts] = useState<PagedResult<Product> | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.products('').then(setProducts).catch(() => setProducts(null));
  }, [api]);

  async function refresh() {
    setProducts(await api.products(search));
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-r from-teal-900 via-teal-800 to-slate-800 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-100">Inventory catalog</p>
            <h2 className="mt-1 text-xl font-semibold">Products</h2>
          </div>
          <button
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={(products?.items.length ?? 0) === 0}
            onClick={() => downloadProductsPdf(products?.items ?? [])}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
        <div className="border-b border-line bg-white p-4">
          <Toolbar search={search} setSearch={setSearch} onSearch={refresh} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(products?.items ?? []).map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{product.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-600">{product.sku}</td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">{product.description ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatMoney(product.price)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{product.stockQuantity}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
