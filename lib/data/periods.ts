import { rows, save } from "./db";
import type { Period } from "./types";
export const listPeriods = () => rows<Period>("reporting_periods", "period_year");
export const savePeriod = (values: Record<string, unknown>, id?: string) => save("reporting_periods", values, id);
