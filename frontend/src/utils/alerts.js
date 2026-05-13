export function getAlerts(p) {
  const res = [];
  if (p.quantity === 0) res.push({ type: 'empty', label: 'Sem estoque', sev: 'danger' });
  else if (p.quantity < p.minQuantity) res.push({ type: 'low', label: 'Estoque baixo', sev: 'warn' });

  if (p.expiryDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((new Date(p.expiryDate + 'T00:00:00') - today) / 86400000);
    if (diff < 0) res.push({ type: 'expired', label: 'Vencido', sev: 'danger' });
    else if (diff <= 7) res.push({ type: 'expiring', label: `Vence em ${diff}d`, sev: 'warn' });
  }
  return res;
}

export function buildShoppingList(products) {
  return products
    .filter((p) => p.quantity < p.minQuantity || p.quantity === 0)
    .map((p) => ({
      ...p,
      toBuy: Math.max(1, (p.maxQuantity || p.minQuantity * 2) - p.quantity),
      urgent: p.quantity === 0,
    }))
    .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}
