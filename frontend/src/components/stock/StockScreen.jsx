import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const LOCATIONS = ['Dispensa', 'Lavanderia', 'Banheiro', 'Quarto', 'Outros'];
const LOC_ICON  = { Dispensa: '🍽️', Lavanderia: '🫧', Banheiro: '🚿', Quarto: '🛏️', Outros: '📦' };

const SORT_OPTIONS = [
  { value: 'name',     label: 'Nome A–Z' },
  { value: 'expiry',   label: 'Validade' },
  { value: 'quantity', label: 'Quantidade' },
];

export default function StockScreen({ products, onEdit, onDelete }) {
  const [activeLocation, setActiveLocation] = useState('Todos');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filtered = useMemo(() => {
    let list = activeLocation === 'Todos' ? products : products.filter((p) => p.location === activeLocation);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt-BR');
      if (sortBy === 'expiry') {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.localeCompare(b.expiryDate);
      }
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      return 0;
    });
  }, [products, activeLocation, search, sortBy]);

  return (
    <div className="dp-screen">
      <div className="dp-hdr">
        <h1>📦 Estoque</h1>
        <p>{products.length} itens cadastrados</p>
      </div>

      <div className="dp-tabs">
        {['Todos', ...LOCATIONS].map((tab) => (
          <button
            key={tab}
            className={`dp-tab ${activeLocation === tab ? 'on' : 'off'}`}
            onClick={() => setActiveLocation(tab)}
          >
            {tab === 'Todos' ? '🔍 Todos' : `${LOC_ICON[tab]} ${tab}`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 14px 10px', alignItems: 'center' }}>
        <div className="dp-search" style={{ flex: 1, margin: 0 }}>
          <span className="dp-search-icon">🔎</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 10px', border: '2px solid #E5E7EB', borderRadius: 14,
            fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700,
            background: 'white', color: '#374151', outline: 'none', cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="dp-empty">
          <div className="e">🗄️</div>
          <p>{search ? 'Nenhum produto encontrado.' : 'Nenhum produto neste local.\nToque no + para adicionar!'}</p>
        </div>
      ) : (
        filtered.map((p) => (
          <ProductCard key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}
