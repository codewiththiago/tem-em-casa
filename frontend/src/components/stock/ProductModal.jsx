import { useState } from 'react';
import { scanBarcode } from './BarcodeScanner';

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'];
const LOCATIONS  = ['Dispensa', 'Lavanderia', 'Banheiro', 'Quarto', 'Outros'];
const UNITS      = ['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa', 'lata'];

export default function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name:        product?.name        || '',
    category:    product?.category    || 'Alimentos',
    location:    product?.location    || 'Dispensa',
    quantity:    product?.quantity    ?? 1,
    minQuantity: product?.minQuantity ?? 1,
    maxQuantity: product?.maxQuantity ?? 5,
    unit:        product?.unit        || 'un',
    expiryDate:  product?.expiryDate  || '',
    barcode:     product?.barcode     || '',
    notes:       product?.notes       || '',
  });
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = await scanBarcode();
      if (result) {
        setForm((f) => ({
          ...f,
          barcode: result.code,
          name: result.name || f.name,
          category: result.category || f.category,
        }));
      }
    } catch (err) {
      console.warn('Scan error:', err);
    }
    setScanning(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setError('Nome do produto é obrigatório.'); return; }
    const qty = Number(form.quantity);
    const min = Number(form.minQuantity);
    const max = Number(form.maxQuantity);
    if (isNaN(qty) || isNaN(min) || isNaN(max)) { setError('Informe quantidades válidas.'); return; }
    if (min > max) { setError('A quantidade mínima não pode ser maior que a máxima.'); return; }
    setError('');
    onSave({ ...form, quantity: qty, minQuantity: min, maxQuantity: max, updatedAt: product?.updatedAt });
  };

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dp-modal-hdr">
          <button className="dp-modal-hdr-action cancel" onClick={onClose}>Cancelar</button>
          <div className="dp-modal-hdr-title">{product ? 'Editar item' : 'Novo item'}</div>
          <button className="dp-modal-hdr-action" onClick={handleSave}>{product ? 'Salvar' : 'Adicionar'}</button>
        </div>

        <div className="dp-modal-body">
        {error && (
          <div style={{ margin: '0 0 8px', padding: '8px 12px', background: '#FEF2F2',
            color: '#DC2626', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            {error}
          </div>
        )}
        <div className="dp-field">
          <label>Nome do produto *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1 }}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Arroz, Detergente..."
            />
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              style={{
                padding: '0 14px', border: '2px solid #E5E7EB', borderRadius: 14,
                background: 'white', cursor: 'pointer', fontSize: 20, flexShrink: 0,
              }}
              title="Escanear código de barras"
            >
              {scanning ? '⏳' : '📷'}
            </button>
          </div>
          {form.barcode && (
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              Cód: {form.barcode}
            </div>
          )}
        </div>

        <div className="dp-row">
          <div className="dp-field">
            <label>Categoria</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="dp-field">
            <label>Local</label>
            <select value={form.location} onChange={(e) => set('location', e.target.value)}>
              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="dp-row">
          <div className="dp-field">
            <label>Atual</label>
            <input type="number" min="0" step="0.01" value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)} />
            <div className="dp-qty-hint">Tenho agora</div>
          </div>
          <div className="dp-field">
            <label>Mínimo</label>
            <input type="number" min="0" step="0.01" value={form.minQuantity}
              onChange={(e) => set('minQuantity', e.target.value)} />
            <div className="dp-qty-hint">Gatilho alerta</div>
          </div>
          <div className="dp-field">
            <label>Máximo</label>
            <input type="number" min="0" step="0.01" value={form.maxQuantity}
              onChange={(e) => set('maxQuantity', e.target.value)} />
            <div className="dp-qty-hint">Meta da lista</div>
          </div>
        </div>

        <div className="dp-row">
          <div className="dp-field">
            <label>Unidade</label>
            <select value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="dp-field">
            <label>Validade <span style={{ color: '#9CA3AF' }}>(opt.)</span></label>
            <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </div>
        </div>

        <div className="dp-field">
          <label>Observações <span style={{ color: '#9CA3AF' }}>(opt.)</span></label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Marca, tipo..." />
        </div>

        <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}
