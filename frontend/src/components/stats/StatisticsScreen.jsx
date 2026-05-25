import { getAlerts } from '../../utils/alerts';

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'];
const CAT_COLORS  = { Alimentos: '#E65100', Bebidas: '#1E3A5F', Limpeza: '#2D5FA3', Higiene: '#C2185B', Outros: '#512DA8' };

const HamburgerIcon = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <path d="M1 1h16M1 7h16M1 13h16" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function StatisticsScreen({ products, onOpenMenu }) {
  const all  = products.flatMap((p) => getAlerts(p).map((a) => ({ ...a, product: p })));
  const crit = all.filter((a) => a.sev === 'danger');
  const warn = all.filter((a) => a.sev === 'warn');

  const catCounts = CATEGORIES.map((c) => ({
    name:  c,
    count: products.filter((p) => p.category === c).length,
    color: CAT_COLORS[c],
  }));
  const maxCat = Math.max(...catCounts.map((c) => c.count), 1);

  const alertRows = [
    { label: 'Estoque zerado',  count: all.filter((a) => a.type === 'empty').length,    color: '#C62828', bg: '#FEF2F2' },
    { label: 'Estoque baixo',   count: all.filter((a) => a.type === 'low').length,      color: '#E65100', bg: '#FFF3E0' },
    { label: 'Vencidos',        count: all.filter((a) => a.type === 'expired').length,  color: '#C62828', bg: '#FEF2F2' },
    { label: 'Vence em 7 dias', count: all.filter((a) => a.type === 'expiring').length, color: '#E65100', bg: '#FFF3E0' },
  ];

  return (
    <div className="dp-screen">
      <div className="dp-hdr">
        <button className="home-header-btn" aria-label="Menu" onClick={onOpenMenu} style={{ marginBottom: 4 }}>
          <HamburgerIcon />
        </button>
        <h1>📊 Estatísticas</h1>
        <p>{products.length} produto{products.length !== 1 ? 's' : ''} no estoque</p>
      </div>

      {/* Top metric cards */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 16px 0' }}>
        {[
          { n: products.length, l: 'Total',    s: 'itens',   color: '#1E3A5F', bg: '#EBF3FF' },
          { n: crit.length,     l: 'Críticos', s: 'urgente', color: crit.length > 0 ? '#C62828' : '#1E3A5F', bg: crit.length > 0 ? '#FEF2F2' : '#EBF3FF' },
          { n: warn.length,     l: 'Avisos',   s: 'atenção', color: warn.length > 0 ? '#E65100' : '#1E3A5F', bg: warn.length > 0 ? '#FFF3E0' : '#EBF3FF' },
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
