import { commentaryAction } from "./commentary";
import { saveProperty } from "@/lib/data/properties";
import { savePeriod } from "@/lib/data/periods";
import { saveLine } from "@/lib/data/lines";
import { db } from "@/lib/data/db";
import { text, number, choice, uuid } from "./validation";
import { variance } from "@/lib/utils/variance";
import { parseIncomeRows } from "@/lib/utils/paste";
export async function mutate(operation: string, v: Record<string, unknown>) {
  if (typeof operation !== "string") throw new Error("Invalid action.");
  const id = v.id ? uuid(v.id) : undefined;
  if (["ai.draft", "explanation.save"].includes(operation)) return commentaryAction(operation,v);
  if (operation === "property.save") {
    const date = text(v.acquisition_date, "Acquisition date", false);
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) throw new Error("Invalid acquisition date.");
    return saveProperty({ name: text(v.name, "Property name"), property_type: choice(v.property_type, ["office", "retail", "industrial", "residential", "mixed"], "property type"), location: text(v.location, "Location", false), acquisition_date: date || null, purchase_price: number(v.purchase_price, "Purchase price", 0) }, id);
  }
  if (operation.endsWith(".delete")) {
    if (v.confirm !== true || !text(v.reason, "Deletion reason")) throw new Error("Confirm deletion and provide a reason.");
    if (["property.delete", "income.delete", "balance.delete"].includes(operation)) {
      const table_name = ({ "property.delete": "properties", "income.delete": "income_statement_lines", "balance.delete": "balance_sheet_lines" } as Record<string, string>)[operation];
      const { data: uploads, error: uploadError } = table_name === "properties" ? await db().from("report_uploads").select("file_url").eq("property_id",uuid(v.id)) : { data: [], error: null };
      if (uploadError) throw new Error(uploadError.message);
      const { error } = await db().rpc("delete_reporting_record", { table_name, record_id: uuid(v.id), reason: text(v.reason, "Reason") });
      if (error) throw new Error(error.message);
      if (uploads?.length) { const { error: storageError } = await db().storage.from("management-reports").remove(uploads.map(u=>u.file_url)); if (storageError) return { id: v.id, warning: "Property deleted. Storage cleanup requires retry by an administrator." }; }
      return { id: v.id };
    }
    
  }
  if (operation === "period.save") {
    const year = number(v.period_year, "Year", 1900, 2200), month = number(v.period_month, "Month", 1, 12);
    if (!Number.isInteger(year) || !Number.isInteger(month)) throw new Error("Year and month must be whole numbers.");
    return savePeriod({ period_year: year, period_month: month, label: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" }), status: choice(v.status || "open", ["open", "closed"], "period status") }, id);
  }
  if (["income.save", "balance.save"].includes(operation)) {
    const kind = operation.startsWith("income") ? "income" : "balance";
    const period_id = uuid(v.period_id);
    const { data: period, error } = await db().from("reporting_periods").select("status").eq("id", period_id).single();
    if (error || !period) throw new Error("Select a valid reporting period.");
    if (period.status === "closed") throw new Error("This period is closed. Reopen it before editing financial data.");
    const values: Record<string, unknown> = { property_id: uuid(v.property_id), period_id, account_name: text(v.account_name, "Account name"), account_category: choice(v.account_category, kind === "income" ? ["revenue", "opex", "capex", "other"] : ["asset", "liability", "equity"], "account category"), actual: number(v.actual, "Actual"), sort_order: number(v.sort_order ?? 0, "Sort order", 0, 100000) };
    for (const field of kind === "income" ? ["budget", "prior_month", "prior_ytd", "ytd_actual"] : ["prior_period"]) values[field] = number(v[field], field.replaceAll("_", " "));
    if (kind === "balance") values.movement_pct = variance(Number(values.actual), Number(values.prior_period)).percent;
    return saveLine(kind, values, id);
  }
  if (operation === "income.paste" || operation === "settings.save") {
    const property_id = uuid(v.property_id), period_id = uuid(v.period_id);
    const { data: period, error: periodError } = await db().from("reporting_periods").select("status").eq("id", period_id).single();
    if (periodError || period.status !== "open") throw new Error("Reopen the reporting period before editing data.");
    if (operation === "income.paste") {
      const batch = parseIncomeRows(text(v.rows, "Spreadsheet rows")).map(row => ({ ...row, property_id, period_id }));
      const { data, error } = await db().from("income_statement_lines").insert(batch).select();
      if (error) throw new Error(error.message); return data;
    }
    const { data, error } = await db().from("report_settings").upsert({ property_id, period_id, amount_threshold: number(v.amount_threshold, "Amount threshold", 0), percent_threshold: number(v.percent_threshold, "Percent threshold", 0, 10000) }, { onConflict: "property_id,period_id" }).select().single();
    if (error) throw new Error(error.message); return data;
  }
  throw new Error("Unknown action.");
}




