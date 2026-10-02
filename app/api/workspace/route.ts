import { NextRequest, NextResponse } from "next/server";
import { listProperties } from "@/lib/data/properties";
import { listPeriods } from "@/lib/data/periods";
import { listIncome, listBalance } from "@/lib/data/lines";
import { rows } from "@/lib/data/db";
import { mutate } from "@/lib/actions/core";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [properties, periods, income, balance, explanations, uploads, settings] = await Promise.all([listProperties(), listPeriods(), listIncome(), listBalance(), rows("variance_explanations"), rows("report_uploads"), rows("report_settings")]);
    return NextResponse.json({ properties, periods: periods.sort((a, b) => b.period_year - a.period_year || b.period_month - a.period_month), income, balance, explanations, uploads, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load data. Please check your connection." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const { operation, values } = await request.json();
    if (!values || typeof values !== "object") throw new Error("Invalid form data.");
    const result = await mutate(operation, values);
    return NextResponse.json({ result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save. Please try again." }, { status: 400 }); }
}

