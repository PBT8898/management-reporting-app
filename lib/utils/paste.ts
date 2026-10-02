export function parseIncomeRows(input: string) {
  const delimiter = input.includes("\t") ? "\t" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && c === delimiter) { row.push(cell.trim()); cell = ""; }
    else if (!quoted && c === "\n") { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (quoted) throw new Error("Unclosed quote in pasted data.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (rows[0]?.[0].toLowerCase().replaceAll(" ", "_") === "account_name") rows.shift();
  if (rows.length === 0 || rows.length > 200) throw new Error("Paste between 1 and 200 rows.");
  return rows.map((r, index) => {
    if (r.length !== 7) throw new Error(`Row ${index + 1}: expected 7 columns (account, category, actual, budget, prior month, prior YTD, current YTD).`);
    if (!r[0] || r[0].length > 200) throw new Error(`Row ${index + 1}: enter an account name up to 200 characters.`);
    if (!["revenue", "opex", "capex", "other"].includes(r[1].toLowerCase())) throw new Error(`Row ${index + 1}: category must be revenue, opex, capex, or other.`);
    const values = r.slice(2).map(raw => {
      const normalized = raw.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
      if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(Number(normalized)) || Math.abs(Number(normalized)) > 1e14) throw new Error(`Row ${index + 1}: invalid amount '${raw}'.`);
      return Number(normalized);
    });
    return { account_name: r[0], account_category: r[1].toLowerCase(), actual: values[0], budget: values[1], prior_month: values[2], prior_ytd: values[3], ytd_actual: values[4], sort_order: index };
  });
}
