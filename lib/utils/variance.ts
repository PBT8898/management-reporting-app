type Line = { actual: number; budget: number; prior_month: number; prior_ytd: number; ytd_actual: number };
export function variance(actual: number, comparison: number, amountThreshold = 5000, percentThreshold = 10) {
  const amount = Number(actual) - Number(comparison);
  const percent = comparison === 0 ? (amount === 0 ? 0 : null) : amount / Math.abs(comparison) * 100;
  return { amount, percent, material: Math.abs(amount) > amountThreshold && (percent === null || Math.abs(percent) > percentThreshold) };
}
export function computeVariances(line: Line, amountThreshold = 5000, percentThreshold = 10) {
  return (["budget", "prior_month", "prior_ytd"] as const).map(type => ({ type, ...variance(type === "prior_ytd" ? Number(line.ytd_actual) : Number(line.actual), Number(line[type]), amountThreshold, percentThreshold) }));
}
export function kpis(lines: Array<{ account_category: string; actual: number; budget: number; ytd_actual: number }>, purchasePrice: number | null) {
  const sum = (category: string, field: "actual" | "budget" | "ytd_actual") => lines.filter(l => l.account_category === category).reduce((total, l) => total + Number(l[field]), 0);
  const revenue = sum("revenue", "actual"), opex = sum("opex", "actual"), revenueBudget = sum("revenue", "budget");
  return { revenue, opex, profit: revenue - opex, revenueBudget, revenueVariance: revenue - revenueBudget, margin: revenue === 0 ? null : (revenue - opex) / revenue * 100, yield: purchasePrice && purchasePrice > 0 ? sum("revenue", "ytd_actual") / purchasePrice * 100 : null };
}
