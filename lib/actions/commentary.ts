import { db } from "@/lib/data/db";
import { text, uuid, choice } from "./validation";
import { draft_variance_explanation } from "@/lib/ai/draft";
import type { Explanation, IncomeLine, Property, Period } from "@/lib/data/types";
export async function commentaryAction(operation: string, values: Record<string,unknown>) {
 const id=uuid(values.id),client=db();
 const {data:row,error}=await client.from("variance_explanations").select("*").eq("id",id).single();
 if(error || !row) throw new Error("Explanation not found. Refresh your report.");
 const current=row as Explanation;
 let commentary: string, source: string, confidence: number|null, status: string;
 if(operation==="ai.draft") {
  if(current.review_status==="approved") throw new Error("Approved explanations are locked from AI edits.");
  if(!current.is_material) throw new Error("Only material variances can be AI drafted.");
  const [line,property,period]=await Promise.all([client.from("income_statement_lines").select("*").eq("id",current.income_line_id).single(),client.from("properties").select("*").eq("id",current.property_id).single(),client.from("reporting_periods").select("*").eq("id",current.period_id).single()]);
  if(line.error || property.error || period.error) throw new Error("Unable to load drafting context.");
  const result=await draft_variance_explanation(line.data as IncomeLine,current,property.data as Property,period.data as Period,text(values.context,"Finance context",false));
  commentary=result.explanation; confidence=result.confidence; source="ai"; status="draft";
 } else {
  commentary=text(values.explanation,"Explanation"); status=choice(values.review_status,["draft","approved"],"review status");
  source=commentary===current.explanation && current.explanation_source==="ai" ? "ai" : "human";
  confidence=source==="ai" ? current.confidence : null;
 }
 const {data,error:saveError}=await client.rpc("save_variance_explanation",{explanation_id:id,commentary,new_status:status,new_source:source,ai_confidence:confidence,expected_amount:values.expected_amount===undefined ? current.variance_amount : values.expected_amount,expected_percent:values.expected_percent===undefined ? current.variance_pct : values.expected_percent,expected_text:values.expected_text===undefined ? current.explanation : values.expected_text}).single();
 if(saveError) throw new Error(saveError.message); return data;
}

