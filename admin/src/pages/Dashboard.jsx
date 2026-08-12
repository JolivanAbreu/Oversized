import { useEffect, useState } from 'react';
import { TrendingUp, Clock, CalendarDays } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from '../components/States';
import { formatPrice, formatDate } from '../lib/format';

function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3.5 rounded-lg border border-line bg-white p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-canvas-alt text-ink">
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard/metrics').then(setMetrics);
  }, []);

  if (!metrics) return <LoadingBlock label="Carregando métricas" />;

  const maxRevenue = Math.max(1, ...metrics.sales_by_day.map((d) => Number(d.revenue)));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">Olá, {user?.name?.split(' ')[0]} — aqui está o resumo da loja.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ticket médio" value={formatPrice(metrics.average_ticket)} icon={TrendingUp} />
        <KpiCard label="Pedidos pagos aguardando separação" value={metrics.pending_orders} icon={Clock} />
        <KpiCard label="Dias com vendas (30d)" value={metrics.sales_by_day.length} icon={CalendarDays} />
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
