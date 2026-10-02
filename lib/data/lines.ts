import { rows, save, remove } from "./db";
import type { IncomeLine, BalanceLine } from "./types";
export const listIncome = () => rows<IncomeLine>("income_statement_lines", "sort_order");
export const listBalance = () => rows<BalanceLine>("balance_sheet_lines", "sort_order");
export const saveLine = (kind: "income" | "balance", values: Record<string, unknown>, id?: string) => save(kind === "income" ? "income_statement_lines" : "balance_sheet_lines", values, id);
export const deleteLine = (kind: "income" | "balance", id: string) => remove(kind === "income" ? "income_statement_lines" : "balance_sheet_lines", id);
