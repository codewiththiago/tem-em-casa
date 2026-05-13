import { useState } from 'react';
import { openWhatsApp, copyText } from '../../utils/whatsapp';

export default function WaBlock({ title, msg, phone }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="dp-wa-block">
      <div className="dp-wa-title">{title}</div>
      <div className="dp-wa-btns">
        <button className="dp-btn-wa green" onClick={() => openWhatsApp(msg, phone)}>
          <span style={{ fontSize: 18 }}>💬</span>WhatsApp
        </button>
        <button
          className={`dp-btn-wa copy ${copied ? 'done' : ''}`}
          onClick={() => copyText(msg, setCopied)}
        >
          {copied ? '✓ Copiado!' : '📋 Copiar'}
        </button>
      </div>
    </div>
  );
}
