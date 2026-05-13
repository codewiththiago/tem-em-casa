import { getAlerts } from '../../utils/alerts';

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'];
const CAT_COLORS  = { Alimentos: '#E65100', Bebidas: '#1565C0', Limpeza: '#2E7D32', Higiene: '#C2185B', Outros: '#512DA8' };

export default function StatisticsScreen({ products }) {
  const all  = products.flatMap((p) => getAlerts(p).map((a) => ({ ...a, product: p })));
  const crit = all.filter((a) => a.sev === 'danger');
  const warn = all.filter((a) => a.sev === 'warn');

  const today = new Date();
  const in7   = new Date(); in7.setDate(today.getDate() + 7);

  const catCounts = CATEGORIES.map((c) => ({
    name:  c,
    count: products.filter((p) => p.category === c).length,
    color: CAT_COLORS[c],
  }));
  const maxCat = Math.max(...catCounts.map((c) => c.count), 1);

  const alertRows = [
    { label: 'Estoque zerado',  count: products.filter((p) => p.quantity === 0).length,                                                   color: '#C62828', bg: '#FEF2F2' },
    { label: 'Estoque baixo',   count: products.filter((p) => p.quantity > 0 && p.quantity <= p.minQuantity).length,                      color: '#E65100', bg: '#FFF3E0' },
    { label: 'Vencidos',        count: products.filter((p) => p.expiryDate && new Date(p.expiryDate) < today).length,                     color: '#C62828', bg: '#FEF2F2' },
    { label: 'Vence em 7 dias', count: products.filter((p) => { if (!p.expiryDate) return false; const d = new Date(p.expiryDate); return d >= today && d <= in7; }).length, color: '#E65100', bg: '#FFF3E0' },
  ];

  return (
    <div className="dp-screen">
      <div className="dp-hdr">
        <h1>📊 Estatísticas</h1>
        <p>{products.length} produto{products.length !== 1 ? 's' : ''} no estoque</p>
      </div>

      {/* Top metric cards */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 16px 0' }}>
        {[
          { n: products.length, l: 'Total',    s: 'itens',   color: '#2E7D32', bg: '#E8F5E9' },
          { n: crit.length,     l: 'Críticos', s: 'urgente', color: crit.length > 0 ? '#C62828' : '#2E7D32', bg: crit.length > 0 ? '#FEF2F2' : '#E8F5E9' },
          { n: warn.length,     l: 'Avisos',   s: 'atenção', color: warn.length > 0 ? '#E65100' : '#2E7D32', bg: warn.length > 0 ? '#FFF3E0' : '#E8F5E9' },
        ].map((m) => (
          <div key={m.l} style={{ flex: 1, background: 'white', borderRadius: 16, padding: '16px 12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, marginBottom: 4 }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.n}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.l}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* By category */}
      <div className="dp-sec" style={{ marginTop: 24 }}><h2>Por Categoria</h2></div>
      <div style={{ padding: '0 16px 8px' }}>
        {catCounts.map((cat) => (
          <div key={cat.name} className="stats-bar-row">
            <div className="stats-bar-label">{cat.name}</div>
            <div className="stats-bar-wrap">
              <div
                className="stats-bar-fill"
                style={{ width: `${(cat.count / maxCat) * 100}%`, background: cat.color }}
              />
            </div>
            <div className="stats-bar-count">{cat.count}</div>
          </div>
        ))}
      </div>

      {/* Alert summary */}
      <div className="dp-sec"><h2>Resumo de Alertas</h2></div>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alertRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderRadius: 12,
              background: row.count > 0 ? row.bg : '#F5F5F5',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: row.count > 0 ? row.color : '#999' }}>{row.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: row.count > 0 ? row.color : '#ccc' }}>{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
