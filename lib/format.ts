export function formatMoney(n: number): string {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
