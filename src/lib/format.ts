export function formatPct(pct: number, fractionDigits = 2): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(fractionDigits)}%`;
}

export function formatPrice(price: number, currency: "USD" | "KRW" = "USD"): string {
  if (currency === "KRW") {
    return `${Math.round(price).toLocaleString("ko-KR")}원`;
  }
  return `$${price.toFixed(2)}`;
}

export function formatChange(change: number, currency: "USD" | "KRW" = "USD"): string {
  const sign = change >= 0 ? "+" : "-";
  if (currency === "KRW") {
    return `${sign}${Math.abs(Math.round(change)).toLocaleString("ko-KR")}원`;
  }
  return `${sign}$${Math.abs(change).toFixed(2)}`;
}
