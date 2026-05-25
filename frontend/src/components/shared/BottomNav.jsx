import { useState } from 'react';

export default function BottomNav({ screen, setScreen, alertCount, shopCount, onAdd, onScan }) {
  const [actionSheet, setActionSheet] = useState(false);

  const left  = [
    { id: 'home',  icon: '🏠', label: 'Início', badge: alertCount },
    { id: 'lista', icon: '🛒', label: 'Lista',  badge: shopCount },
  ];
  const right = [
    { id: 'stock',  icon: '📦', label: 'Estoque', badge: 0 },
    { id: 'stats',  icon: '📊', label: 'Stats',   badge: 0 },
  ];

  const NavItem = ({ item }) => (
    <button
      className={`dp-nav-item ${screen === item.id ? 'on' : 'off'}`}
      onClick={() => setScreen(item.id)}
    >
      {item.badge > 0 && (
        <span className="dp-nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
      )}
      <span className="dp-nav-icon">{item.icon}</span>
      <span className="dp-nav-label">{item.label}</span>
    </button>
  );

  return (
    <>
      {actionSheet && (
        <div className="dp-overlay center" onClick={() => setActionSheet(false)}>
          <div className="dp-action-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="dp-action-sheet-btn" onClick={() => { setActionSheet(false); onAdd(); }}>
              <span>➕</span>
              <span>Novo produto</span>
            </button>
            <div className="dp-action-sheet-divider" />
            <button className="dp-action-sheet-btn" onClick={() => { setActionSheet(false); onScan(); }}>
              <span>📷</span>
              <span>Escanear código</span>
            </button>
            <button className="dp-action-sheet-cancel" onClick={() => setActionSheet(false)}>Cancelar</button>
          </div>
        </div>
      )}
      <div className="dp-nav">
        {left.map((item)  => <NavItem key={item.id} item={item} />)}
        <button className="dp-nav-scan" onClick={() => setActionSheet(true)} aria-label="Adicionar produto">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        {right.map((item) => <NavItem key={item.id} item={item} />)}
      </div>
    </>
  );
}
