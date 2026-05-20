import { useState } from 'react';
import { getAlerts } from '../../utils/alerts';

const NAV_ITEMS = [
  { id: 'home',   icon: '🏠', label: 'Início' },
  { id: 'stock',  icon: '📦', label: 'Estoque' },
  { id: 'lista',  icon: '🛒', label: 'Lista de compras' },
  { id: 'stats',  icon: '📊', label: 'Estatísticas' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Família' },
];

const CATEGORIES = [
  { id: 'Alimentos', icon: '🍎', bg: '#FFF3E0', color: '#E65100' },
  { id: 'Bebidas',   icon: '🥤', bg: '#E3F2FD', color: '#1565C0' },
  { id: 'Limpeza',   icon: '🧹', bg: '#EBF3FF', color: '#1E3A5F' },
  { id: 'Higiene',   icon: '🧴', bg: '#FCE4EC', color: '#C2185B' },
  { id: 'Outros',    icon: '📦', bg: '#EDE7F6', color: '#512DA8' },
];

const TIPS = [
  { icon: '📷', title: 'Escanear',      desc: 'Toque no botão central para escanear código de barras.' },
  { icon: '🔔', title: 'Alertas',       desc: 'Receba alertas quando o estoque estiver baixo.' },
  { icon: '📊', title: 'Estatísticas',  desc: 'Veja gráficos e métricas do estoque.' },
  { icon: '🛒', title: 'Comprar',       desc: 'Lista de compras gerada automaticamente.' },
];

export default function HomeScreen({ family, user, products, onEdit, onNavigate, onLogout }) {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const all  = products.flatMap((p) => getAlerts(p).map((a) => ({ ...a, product: p })));
  const crit = all.filter((a) => a.sev === 'danger');
  const warn = all.filter((a) => a.sev === 'warn');

  const today = new Date();
  const in14  = new Date(); in14.setDate(today.getDate() + 14);
  const expiring = products
    .filter((p) => { if (!p.expiryDate) return false; const d = new Date(p.expiryDate); return d >= today && d <= in14; })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const results = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const daysLeft = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - today) / 86400000);
    if (diff === 0) return 'Vence hoje';
    if (diff === 1) return 'Vence amanhã';
    return `Vence em ${diff} dias`;
  };

  const name = user?.name?.split(' ')[0] || 'você';

  return (
    <div className="dp-screen">
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
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
                onClick={() => { onNavigate(item.id); setDrawerOpen(false); }}
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
      )}

      {/* Header */}
      <div className="home-header">
        <button className="home-header-btn" aria-label="Menu" onClick={() => setDrawerOpen(true)}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 1h16M1 7h16M1 13h16" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="home-logo">
          🏡 <span>tem em casa?</span>
        </div>
        <button className="home-header-btn" aria-label="Notificações">
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M9 0C7.9 0 7 .9 7 2c0 .3.1.5.2.8C4.2 3.8 2 6.7 2 10v6H0v2h18v-2h-2v-6c0-3.3-2.2-6.2-5.2-7.2.1-.3.2-.5.2-.8 0-1.1-.9-2-2-2zm0 20c1.1 0 2-.9 2-2H7c0 1.1.9 2 2 2z" fill="#333"/>
          </svg>
        </button>
      </div>

      {/* Greeting */}
      <div className="home-greeting">
        <div className="home-greeting-name">Olá, {name}! 👋</div>
        <div className="home-greeting-sub">Veja o que você tem em casa</div>
      </div>

      {/* Search */}
      <div className="home-search-wrap">
        <div className="home-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 20, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, marginTop: 8, padding: '0 16px', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
            {results.map((p) => (
              <div key={p.id} className="home-search-result" onClick={() => { onEdit(p); setSearch(''); }}>
                <div className="home-search-result-name">{p.name}</div>
                <div className="home-search-result-meta">{p.category} · {p.quantity} {p.unit}</div>
              </div>
            ))}
          </div>
        )}
        {search.trim() && results.length === 0 && (
          <div style={{ padding: '14px 16px', fontSize: 14, color: '#aaa', textAlign: 'center', background: 'white', borderRadius: 12, marginTop: 8 }}>
            Nenhum produto encontrado
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="home-stats">
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: '#EBF3FF' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div className="home-stat-n" style={{ color: '#1E3A5F' }}>{products.length}</div>
          <div className="home-stat-l">Itens</div>
          <div className="home-stat-s">no estoque</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: crit.length > 0 ? '#FEE2E2' : '#EBF3FF' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={crit.length > 0 ? '#C62828' : '#1E3A5F'} strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="home-stat-n" style={{ color: crit.length > 0 ? '#C62828' : '#1E3A5F' }}>{crit.length}</div>
          <div className="home-stat-l">Críticos</div>
          <div className="home-stat-s">urgente</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: warn.length > 0 ? '#FFF3E0' : '#EBF3FF' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={warn.length > 0 ? '#E65100' : '#1E3A5F'} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="home-stat-n" style={{ color: warn.length > 0 ? '#E65100' : '#1E3A5F' }}>{warn.length}</div>
          <div className="home-stat-l">Avisos</div>
          <div className="home-stat-s">atenção</div>
        </div>
      </div>

      {/* Alert banner */}
      {crit.length > 0 && (
        <div className="home-alert-banner">
          <span>🚨</span>
          <span>{crit.length} item{crit.length > 1 ? 's' : ''} precisa{crit.length === 1 ? '' : 'm'} de atenção urgente</span>
        </div>
      )}

      {/* Categories */}
      <div className="home-section-hdr">
        <span>Categorias</span>
      </div>
      <div className="home-categories">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="home-cat-chip">
            <div className="home-cat-icon" style={{ background: cat.bg }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
            </div>
            <div className="home-cat-name">{cat.id}</div>
            <div className="home-cat-count">{products.filter((p) => p.category === cat.id).length}</div>
          </div>
        ))}
      </div>

      {/* Expiring soon */}
      {expiring.length > 0 && (
        <>
          <div className="home-section-hdr">
            <span>Próximos do Vencimento</span>
            <span className="home-section-link">{expiring.length} item{expiring.length > 1 ? 's' : ''}</span>
          </div>
          <div style={{ padding: '0 20px' }}>
            {expiring.map((p) => (
              <div key={p.id} className="home-expiring-item" onClick={() => onEdit(p)}>
                <div className="home-expiring-avatar">{p.name.charAt(0).toUpperCase()}</div>
                <div className="home-expiring-info">
                  <div className="home-expiring-name">{p.name}</div>
                  <div className="home-expiring-days">{daysLeft(p.expiryDate)}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tips */}
      <div className="home-tips-hdr">Como usar</div>
      <div className="home-tips">
        {TIPS.map((t) => (
          <div key={t.title} className="home-tip-card">
            <div className="home-tip-icon">{t.icon}</div>
            <div className="home-tip-title">{t.title}</div>
            <div className="home-tip-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
