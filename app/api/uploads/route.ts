import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/db";
import { uuid, text } from "@/lib/actions/validation";
import { validOrigin } from "@/lib/actions/origin";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
 try {
  if (!validOrigin(request)) throw new Error("Invalid request origin.");
  const form = await request.formData(), file = form.get("file");
  const property_id = uuid(form.get("property_id")), period_id = uuid(form.get("period_id"));
  const { data: period, error: periodError } = await db().from("reporting_periods").select("status").eq("id", period_id).single();
  if (periodError || period.status !== "open") throw new Error("Reopen this reporting period before uploading.");
  if (!(file instanceof File) || file.size === 0 || file.size > 4 * 1024 * 1024) throw new Error("Choose a non-empty PDF, Excel, or CSV file up to 4 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const types: Record<string,string> = { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", csv: "text/csv" };
  if (!types[extension]) throw new Error("Only PDF, Excel, or CSV reports are supported.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (extension === "pdf" && bytes.subarray(0,5).toString() !== "%PDF-") throw new Error("The file is not a valid PDF.");
  if (extension === "xlsx" && bytes.subarray(0,2).toString() !== "PK") throw new Error("The file is not a valid Excel workbook.");
  if (extension === "xls" && bytes.subarray(0,8).toString("hex") !== "d0cf11e0a1b11e1") throw new Error("The file is not a valid Excel workbook.");
  if (extension === "csv" && bytes.includes(0)) throw new Error("The file is not a text CSV report.");
  const path = `${property_id}/${period_id}/${crypto.randomUUID()}.${extension}`, client = db();
  const { error: storageError } = await client.storage.from("management-reports").upload(path, bytes, { contentType: types[extension] });
  if (storageError) throw new Error(storageError.message);
  const { data, error } = await client.from("report_uploads").insert({ property_id, period_id, file_name: file.name.slice(0,200), file_url: path, uploaded_by: "Finance workspace" }).select().single();
  if (error) { await client.storage.from("management-reports").remove([path]); throw new Error(error.message); }
  return NextResponse.json({ result: data });
 } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 }); }
}
export async function GET(request: NextRequest) {
 try {
  const id = uuid(request.nextUrl.searchParams.get("id"));
  const { data, error } = await db().from("report_uploads").select("file_url").eq("id",id).single();
  if (error || !data) throw new Error("Report not found.");
  const { data: signed, error: signError } = await db().storage.from("management-reports").createSignedUrl(data.file_url, 60, { download: true });
  if (signError || !signed) throw new Error("Unable to download this report.");
  return NextResponse.redirect(signed.signedUrl);
 } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Download failed." }, { status: 404 }); }
}
export async function DELETE(request: NextRequest) {
 try {
  if (!validOrigin(request)) throw new Error("Invalid request origin.");
  const values = await request.json(), id = uuid(values.id), reason = text(values.reason,"Deletion reason");
  if (values.confirm !== true) throw new Error("Confirm deletion.");
  const client = db(), { data, error } = await client.from("report_uploads").select("file_url").eq("id",id).single();
  if (error) throw new Error(error.message);
  const { error: deletionError } = await client.rpc("delete_reporting_record",{table_name:"report_uploads",record_id:id,reason});
  if (deletionError) throw new Error(deletionError.message);
  const { error: storageError } = await client.storage.from("management-reports").remove([data.file_url]);
  return NextResponse.json({ result: { id }, warning: storageError ? "Report removed. Storage cleanup requires retry by an administrator." : undefined });
 } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed." }, { status: 400 }); }
}
