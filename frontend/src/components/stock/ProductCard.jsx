import { getAlerts } from '../../utils/alerts';

const CAT_ICON = { Alimentos: '🥫', Bebidas: '🥤', Limpeza: '🧹', Higiene: '🧴', Outros: '📦' };
const fmtDate = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('pt-BR') : null);

export default function ProductCard({ product: p, onEdit, onDelete }) {
  const als = getAlerts(p);
  const hasDanger = als.some((a) => a.sev === 'danger');
  const hasWarn = als.some((a) => a.sev === 'warn');
  const qtyColor = p.quantity === 0 ? '#DC2626' : p.quantity < p.minQuantity ? '#D97706' : '#2A7A4F';
  const max = p.maxQuantity || p.minQuantity * 2;
  const pct = Math.min(100, Math.round((p.quantity / max) * 100));
  const barColor = p.quantity === 0 ? '#EF4444' : p.quantity < p.minQuantity ? '#F59E0B' : '#22C55E';

  return (
    <div className={`dp-card ${hasDanger ? 'has-danger' : hasWarn ? 'has-warn' : ''}`}>
      <div className="dp-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dp-card-name">{CAT_ICON[p.category] || '📦'} {p.name}</div>
          <div className="dp-card-sub">{p.category} · {p.location}</div>
        </div>
        <div className="dp-card-qty" style={{ marginLeft: 12, flexShrink: 0 }}>
          <div className="n" style={{ color: qtyColor }}>{p.quantity}</div>
          <div className="u">{p.unit}</div>
        </div>
      </div>
      <div className="dp-qty-bar-labels">
        <span>Mín: {p.minQuantity}</span>
        <span style={{ color: qtyColor }}>{p.quantity}/{max} {p.unit}</span>
        <span>Máx: {max}</span>
      </div>
      <div className="dp-qty-bar-bg">
        <div className="dp-qty-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="dp-card-bottom">
        <div className="dp-badges">
          {als.map((a, i) => <span key={i} className={`dp-badge ${a.sev}`}>{a.label}</span>)}
          {p.expiryDate && als.every((a) => a.type !== 'expired' && a.type !== 'expiring') && (
            <span className="dp-badge date">📅 {fmtDate(p.expiryDate)}</span>
          )}
          {als.length === 0 && <span className="dp-badge ok">✓ OK</span>}
        </div>
        <div className="dp-actions">
          <button className="dp-btn-icon edit" onClick={() => onEdit(p)}>✏️</button>
          <button className="dp-btn-icon del" onClick={() => onDelete(p.id)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
