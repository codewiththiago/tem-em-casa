const CAT_ICON = { Alimentos: '🥫', Bebidas: '🥤', Limpeza: '🧹', Higiene: '🧴', Outros: '📦' };
const fmtDate = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('pt-BR') : null);

export default function AlertCard({ alert: { product: p, type, label, sev }, onEdit }) {
  const msgs = {
    empty: 'Sem estoque — precisa reabastecer',
    low: `Apenas ${p.quantity}/${p.minQuantity} ${p.unit} restante(s)`,
    expired: `Venceu em ${fmtDate(p.expiryDate)}`,
    expiring: `Vence em ${fmtDate(p.expiryDate)}`,
  };
  return (
    <div className="dp-alert-card" onClick={() => onEdit(p)}>
      <div style={{ fontSize: 30, flexShrink: 0 }}>{CAT_ICON[p.category] || '📦'}</div>
      <div className="dp-alert-info">
        <div className="dp-alert-name">{p.name}</div>
        <div className="dp-alert-detail">{msgs[type]}</div>
        <div className="dp-alert-tag">
          <span className={`dp-badge ${sev}`}>{label}</span>
        </div>
      </div>
      <span style={{ color: '#9CA3AF', fontSize: 18 }}>›</span>
    </div>
  );
}
