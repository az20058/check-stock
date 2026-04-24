export function formatPct(pct: number, fractionDigits = 2): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(fractionDigits)}%`;
}

export function formatPrice(price: number, fractionDigits = 2): string {
  return `$${price.toFixed(fractionDigits)}`;
}

export function formatChange(change: number, fractionDigits = 2): string {
  const sign = change >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(change).toFixed(fractionDigits)}`;
}
