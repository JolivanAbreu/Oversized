import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LoadingBlock } from '../components/States';
import { formatPrice, formatDate } from '../lib/format';

function KpiCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard/metrics').then(setMetrics);
  }, []);

  if (!metrics) return <LoadingBlock label="Carregando métricas" />;

  const maxRevenue = Math.max(1, ...metrics.sales_by_day.map((d) => Number(d.revenue)));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ticket médio" value={formatPrice(metrics.average_ticket)} />
        <KpiCard label="Pedidos pagos aguardando separação" value={metrics.pending_orders} />
        <KpiCard label="Dias com vendas (30d)" value={metrics.sales_by_day.length} />
      </div>

      <section className="mt-6 rounded-lg border border-line bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Vendas por dia (últimos 30 dias)</h2>
        {metrics.sales_by_day.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="mt-6 flex items-end gap-1" style={{ height: 160 }}>
            {metrics.sales_by_day.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div
                  className="rounded-t bg-tag transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max(4, (Number(d.revenue) / maxRevenue) * 150)}px` }}
                />
                <div className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {formatDate(d.day)} · {formatPrice(d.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Mais vendidos</h2>
        {metrics.best_selling_products.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhuma venda registrada ainda.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <tbody>
              {metrics.best_selling_products.map((p, i) => (
                <tr key={p.name} className="border-b border-line last:border-0">
                  <td className="py-2 text-ink-soft">{i + 1}</td>
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-right font-mono">{p.units_sold} un.</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
