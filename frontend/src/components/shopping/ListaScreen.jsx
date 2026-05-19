import { useState, useMemo } from 'react';
import { buildShoppingList } from '../../utils/alerts';
import { buildShoppingMsg } from '../../utils/whatsapp';
import WaBlock from '../shared/WaBlock';
import { jsPDF } from 'jspdf';

const CAT_ICON = { Alimentos: '🥫', Bebidas: '🥤', Limpeza: '🧹', Higiene: '🧴', Outros: '📦' };
const LOC_ICON = { Dispensa: '🍽️', Lavanderia: '🫧', Banheiro: '🚿', Quarto: '🛏️', Outros: '📦' };

function ShopItem({ item, chk, onToggle }) {
  return (
    <div className={`dp-shop-card ${chk ? 'chk' : ''}`} onClick={onToggle}>
      <div className={`dp-shop-check ${chk ? 'on' : ''}`}>
        {chk && <span style={{ color: 'white', fontSize: 14, fontWeight: 900 }}>✓</span>}
      </div>
      <div className="dp-shop-info">
        <div className={`dp-shop-name ${chk ? 'chk' : ''}`}>{CAT_ICON[item.category] || '📦'} {item.name}</div>
        <div className="dp-shop-meta">{LOC_ICON[item.location] || '📦'} {item.location} · Tem {item.quantity} · Máx {item.maxQuantity || '?'} {item.unit}</div>
      </div>
      <div className="dp-shop-qty">
        <div className="n" style={{ color: item.urgent ? '#DC2626' : '#D97706' }}>{item.toBuy}</div>
        <div className="u">{item.unit}</div>
      </div>
    </div>
  );
}

export default function ListaScreen({ family, products }) {
  const list = useMemo(() => buildShoppingList(products), [products]);
  const [checked, setChecked] = useState({});
  const toggle = (id) => setChecked((p) => ({ ...p, [id]: !p[id] }));

  const doneCount = list.filter((i) => checked[i.id]).length;
  const pct = list.length > 0 ? Math.round((doneCount / list.length) * 100) : 0;
  const unchecked = list.filter((i) => !checked[i.id]);
  const chkd = list.filter((i) => checked[i.id]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Lista de Compras — ${family.name}`, 20, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('pt-BR'), 20, 28);

    const byLoc = {};
    list.forEach((i) => { (byLoc[i.location] = byLoc[i.location] || []).push(i); });

    let y = 38;
    Object.entries(byLoc).forEach(([loc, items]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(loc, 20, y); y += 7;
      doc.setFont('helvetica', 'normal');
      items.forEach((i) => {
        const tag = i.urgent ? ' [urgente]' : '';
        doc.text(`  - ${i.name}  -  ${i.toBuy} ${i.unit}${tag}`, 20, y);
        y += 7;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 4;
    });

    doc.save(`lista-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="dp-screen">
      <div className="dp-hdr">
        <h1>🛒 Lista de Compras</h1>
        <p>{list.length === 0 ? 'Nada para comprar!' : `${list.length} ${list.length === 1 ? 'item' : 'itens'} na lista`}</p>
      </div>

      {list.length > 0 && (
        <div className="dp-shop-hdr">
          <div className="dp-prog-labels">
            <span>Progresso</span>
            <span>{doneCount}/{list.length} ✓</span>
          </div>
          <div className="dp-prog-bg">
            <div className="dp-prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <WaBlock
            title="📤 Enviar lista para a família"
            msg={buildShoppingMsg(list, family.name)}
            phone={family.whatsappPhone}
          />
          <div style={{ padding: '0 14px 14px' }}>
            <button
              onClick={exportPdf}
              style={{
                width: '100%', padding: 12, background: '#F3F4F6', color: '#374151',
                border: '2px solid #E5E7EB', borderRadius: 14, fontFamily: 'Nunito, sans-serif',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="dp-empty">
          <div className="e">🎉</div>
          <p>Nada para comprar!<br />Estoque dentro dos limites.</p>
        </div>
      ) : (
        <>
          {unchecked.filter((i) => i.urgent).length > 0 && <div className="dp-divider">🔴 Sem estoque — urgente</div>}
          {unchecked.filter((i) => i.urgent).map((item) => <ShopItem key={item.id} item={item} chk={false} onToggle={() => toggle(item.id)} />)}
          {unchecked.filter((i) => !i.urgent).length > 0 && <div className="dp-divider">⚠️ Abaixo do mínimo</div>}
          {unchecked.filter((i) => !i.urgent).map((item) => <ShopItem key={item.id} item={item} chk={false} onToggle={() => toggle(item.id)} />)}
          {chkd.length > 0 && (
            <>
              <div className="dp-divider">✓ Já no carrinho</div>
              {chkd.map((item) => <ShopItem key={item.id} item={item} chk={true} onToggle={() => toggle(item.id)} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}
