const NAV_ITEMS = [
  { id: 'home',   icon: '🏠', label: 'Início' },
  { id: 'stock',  icon: '📦', label: 'Estoque' },
  { id: 'lista',  icon: '🛒', label: 'Lista de compras' },
  { id: 'stats',  icon: '📊', label: 'Estatísticas' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Família' },
];

export default function AppDrawer({ open, onClose, user, family, onNavigate, onLogout }) {
  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-profile">
          <div className="drawer-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div className="drawer-name">{user?.name}</div>
            <div className="drawer-email">{user?.email}</div>
          </div>
        </div>
        <div className="drawer-divider" />
        <div className="drawer-family">
          <span className="drawer-family-label">Grupo familiar</span>
          <span className="drawer-family-name">{family?.name}</span>
        </div>
        <div className="drawer-divider" />
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className="drawer-item"
            onClick={() => { onNavigate(item.id); onClose(); }}
          >
            <span className="drawer-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="drawer-divider" />
        <button className="drawer-logout" onClick={onLogout}>
          <span>🚪</span>
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );
}
