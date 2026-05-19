import { getAlerts } from './alerts';

const todayFmt = () => new Date().toLocaleDateString('pt-BR');
const fmtDate = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('pt-BR') : null);

export function buildAlertsMsg(products, familyName) {
  const all = products.flatMap((p) => getAlerts(p).map((a) => ({ ...a, product: p })));
  const crit = all.filter((a) => a.sev === 'danger');
  const warn = all.filter((a) => a.sev === 'warn');
  if (all.length === 0) return `✅ Tudo em ordem no estoque!\n📅 ${todayFmt()}`;

  let msg = `🏡 *Tem em Casa — ${familyName || 'Família'} - Alertas*\n📅 ${todayFmt()}\n\n`;
  if (crit.length > 0) {
    msg += `🚨 *URGENTE:*\n`;
    crit.forEach(({ product: p, type }) => {
      if (type === 'empty') msg += `• ${p.name} — Sem estoque (${p.location})\n`;
      if (type === 'expired') msg += `• ${p.name} — Vencido em ${fmtDate(p.expiryDate)}\n`;
    });
    msg += '\n';
  }
  if (warn.length > 0) {
    msg += `⚠️ *ATENÇÃO:*\n`;
    warn.forEach(({ product: p, type }) => {
      if (type === 'low') msg += `• ${p.name} — Baixo (${p.quantity}/${p.minQuantity} ${p.unit})\n`;
      if (type === 'expiring') msg += `• ${p.name} — Vence em ${fmtDate(p.expiryDate)}\n`;
    });
  }
  return msg.trim();
}

export function buildShoppingMsg(list, familyName) {
  if (list.length === 0) return `✅ Nada para comprar!\n📅 ${todayFmt()}`;
  let msg = `🛒 *Lista de Compras — ${familyName || 'Família'}*\n📅 ${todayFmt()}\n\n`;
  const byLoc = {};
  list.forEach((i) => { (byLoc[i.location] = byLoc[i.location] || []).push(i); });
  Object.entries(byLoc).forEach(([loc, items]) => {
    msg += `📍 *${loc}*\n`;
    items.forEach((i) => { msg += `• ${i.name} — ${i.toBuy} ${i.unit}${i.urgent ? ' 🔴' : ''}\n`; });
    msg += '\n';
  });
  msg += `_Total: ${list.length} ${list.length === 1 ? 'item' : 'itens'}_`;
  return msg.trim();
}

export function buildInviteMsg(code, familyName) {
  return `🏡 *Convite — Tem em Casa (${familyName || 'Família'})*\n\nOlá! Te convido para gerenciarmos o estoque da casa juntos.\n\n📱 *Abra o app e use:*\n• Código: *${code}*\n• PIN: o que combinamos pessoalmente\n\nVamos manter tudo sempre abastecido! 🏡`;
}

export function openWhatsApp(msg, phone) {
  const clean = (phone || '').replace(/\D/g, '');
  const url = clean
    ? `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

export async function copyText(text, setCopied) {
  try { await navigator.clipboard.writeText(text); } catch {}
  setCopied(true);
  setTimeout(() => setCopied(false), 2200);
}
