import { saveProperty, deleteProperty } from "@/lib/data/properties";
import { savePeriod } from "@/lib/data/periods";
import { saveLine, deleteLine } from "@/lib/data/lines";
import { db } from "@/lib/data/db";
import { text, number, choice, uuid } from "./validation";
import { variance } from "@/lib/utils/variance";
export async function mutate(operation: string, v: Record<string, unknown>) {
  const id = v.id ? uuid(v.id) : undefined;
  if (operation === "property.save") {
    const date = text(v.acquisition_date, "Acquisition date", false);
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) throw new Error("Invalid acquisition date.");
    return saveProperty({ name: text(v.name, "Property name"), property_type: choice(v.property_type, ["office", "retail", "industrial", "residential", "mixed"], "property type"), location: text(v.location, "Location", false), acquisition_date: date || null, purchase_price: number(v.purchase_price, "Purchase price", 0) }, id);
  }
  if (operation.endsWith(".delete")) {
    if (v.confirm !== true || !text(v.reason, "Deletion reason")) throw new Error("Confirm deletion and provide a reason.");
    if (operation === "property.delete") return deleteProperty(uuid(v.id));
    if (["income.delete", "balance.delete"].includes(operation)) return deleteLine(operation.startsWith("income") ? "income" : "balance", uuid(v.id));
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
  throw new Error("Unknown action.");
}
