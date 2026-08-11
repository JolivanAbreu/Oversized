import { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/client';
import Button from '../components/Button';
import { LoadingBlock, ErrorNotice } from '../components/States';
import { formatPrice, formatDate } from '../lib/format';

const STATUS_LABELS = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
};

const METHOD_LABELS = { card: 'Cartão', pix: 'Pix' };

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function Reports() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [from, setFrom] = useState(toInputDate(thirtyDaysAgo));
  const [to, setTo] = useState(toInputDate(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    api.get(`/admin/reports/sales?from=${from}&to=${to}`)
      .then(setReport)
      .catch((err) => setError(err.message || 'Não foi possível carregar o relatório.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilter(e) {
    e.preventDefault();
    load();
  }

  function handleExport() {
    const token = getAccessToken();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/admin/reports/sales/export?from=${from}&to=${to}`;
    // Download autenticado: como <a href> não manda o header Authorization,
    // buscamos o arquivo via fetch e disparamos o download manualmente.
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio-vendas-${from}-a-${to}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Relatório de vendas</h1>
        <Button variant="secondary" onClick={handleExport} disabled={!report}>Exportar CSV</Button>
      </div>

      <form onSubmit={handleFilter} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-wide text-ink-soft">De</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-wide text-ink-soft">Até</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="mt-6">
        <ErrorNotice message={error} />
      </div>

      {loading && <LoadingBlock label="Carregando relatório" />}

      {!loading && report && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Faturamento" value={formatPrice(report.summary.totalRevenue)} />
            <KpiCard label="Pedidos" value={report.summary.totalOrders} />
            <KpiCard label="Ticket médio" value={formatPrice(report.summary.averageTicket)} />
            <KpiCard label="Cancelados" value={report.summary.cancelledOrders} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Por status</h2>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {report.byStatus.map((s) => (
                    <tr key={s.status} className="border-b border-line last:border-0">
                      <td className="py-2">{STATUS_LABELS[s.status] || s.status}</td>
                      <td className="py-2 text-right text-ink-soft">{s.count} pedido(s)</td>
                      <td className="py-2 text-right font-mono">{formatPrice(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Por meio de pagamento</h2>
              {report.byPaymentMethod.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">Nenhum pagamento aprovado no período.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {report.byPaymentMethod.map((m) => (
                      <tr key={m.method} className="border-b border-line last:border-0">
                        <td className="py-2">{METHOD_LABELS[m.method] || m.method}</td>
                        <td className="py-2 text-right text-ink-soft">{m.count} pedido(s)</td>
                        <td className="py-2 text-right font-mono">{formatPrice(m.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-lg border border-line bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Produtos mais vendidos no período</h2>
            {report.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">Nenhuma venda no período.</p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {report.topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-line last:border-0">
                      <td className="py-2 text-ink-soft">{i + 1}</td>
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-right text-ink-soft">{p.unitsSold} un.</td>
                      <td className="py-2 text-right font-mono">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mt-6 rounded-lg border border-line bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Vendas por dia</h2>
            {report.byDay.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">Nenhuma venda no período.</p>
            ) : (
              <div className="mt-6 flex items-end gap-1" style={{ height: 140 }}>
                {report.byDay.map((d) => {
                  const max = Math.max(1, ...report.byDay.map((x) => x.revenue));
                  return (
                    <div key={d.day} className="group relative flex-1">
                      <div className="rounded-t bg-tag transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(4, (d.revenue / max) * 130)}px` }} />
                      <div className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                        {formatDate(d.day)} · {formatPrice(d.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
