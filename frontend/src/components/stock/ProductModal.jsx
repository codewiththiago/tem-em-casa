import { useState } from 'react';
import { scanBarcode } from './BarcodeScanner';

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'];
const LOCATIONS  = ['Dispensa', 'Lavanderia', 'Banheiro', 'Quarto', 'Outros'];
const UNITS      = ['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa', 'lata'];

export default function ProductModal({ product, prefill, onSave, onClose, products = [], onMatchExisting }) {
  const [form, setForm] = useState({
    name:        product?.name        || prefill?.name     || '',
    category:    product?.category    || prefill?.category || 'Alimentos',
    location:    product?.location    || 'Dispensa',
    quantity:    product?.quantity    ?? 1,
    minQuantity: product?.minQuantity ?? 1,
    maxQuantity: product?.maxQuantity ?? 5,
    unit:        product?.unit        || 'un',
    expiryDate:  product?.expiryDate  || '',
    barcode:     product?.barcode     || prefill?.code     || '',
    notes:       product?.notes       || '',
  });
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [matchCandidates, setMatchCandidates] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleScan = async () => {
    setScanning(true);
    setMatchCandidates(null);
    try {
      const result = await scanBarcode();
      if (!result) { setScanning(false); return; }

      // 1. Exact barcode match → switch to edit that product
      const barcodeMatch = products.find((p) => p.barcode && p.barcode === result.code);
      if (barcodeMatch) {
        onMatchExisting(barcodeMatch);
        setScanning(false);
        return;
      }

      // 2. Name similarity match → offer to link or create new
      if (result.name) {
        const firstWord = result.name.toLowerCase().split(' ')[0];
        const candidates = products.filter((p) =>
          p.name.toLowerCase().includes(firstWord) && firstWord.length >= 3
        );
        if (candidates.length > 0) {
          setMatchCandidates({ result, candidates });
          setScanning(false);
          return;
        }
      }

      // 3. No match → prefill form
      setForm((f) => ({
        ...f,
        barcode: result.code,
        name: result.name || f.name,
        category: result.category || f.category,
      }));
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

  // Match candidates picker overlay
  if (matchCandidates) {
    return (
      <div className="dp-overlay" onClick={onClose}>
        <div className="dp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dp-modal-hdr">
            <button className="dp-modal-hdr-action cancel" onClick={() => setMatchCandidates(null)}>Voltar</button>
            <div className="dp-modal-hdr-title">Produto encontrado</div>
            <div style={{ width: 60 }} />
          </div>
          <div className="dp-modal-body" style={{ padding: '16px 16px 24px' }}>
            <p style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginBottom: 12 }}>
              Escaneado: <strong style={{ color: '#1E3A5F' }}>{matchCandidates.result.name || matchCandidates.result.code}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#374151', fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 8 }}>
              Adicionar ao produto existente:
            </p>
            {matchCandidates.candidates.map((p) => (
              <button
                key={p.id}
                onClick={() => onMatchExisting(p)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 14px', marginBottom: 8,
                  background: '#F0F9F4', border: '2px solid #BBF7D0', borderRadius: 12,
                  fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700,
                  color: '#1E3A5F', cursor: 'pointer',
                }}
              >
                📦 {p.name} <span style={{ color: '#6B7280', fontWeight: 600 }}>· {p.quantity} {p.unit}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', margin: '12px 0' }} />
            <button
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  barcode: matchCandidates.result.code,
                  name: matchCandidates.result.name || f.name,
                  category: matchCandidates.result.category || f.category,
                }));
                setMatchCandidates(null);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 14px',
                background: '#EBF3FF', border: '2px solid #BFDBFE', borderRadius: 12,
                fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700,
                color: '#1E3A5F', cursor: 'pointer',
              }}
            >
              ➕ Criar novo produto
            </button>
          </div>
        </div>
      </div>
    );
  }

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
