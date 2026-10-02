import "server-only";
import { createClient } from "@supabase/supabase-js";
export function db() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url || !key) throw new Error("Database environment is missing. Pull this project's Vercel environment before running the app.");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function rows<T>(table:string,order="created_at"):Promise<T[]> {
 const records:T[]=[];
 for(let offset=0;offset<100000;offset+=1000){
  const {data,error}=await db().from(table).select("*").order(order).order("id").range(offset,offset+999);
  if(error) throw new Error(`Unable to load ${table}: ${error.message}`);
  records.push(...data as T[]);
  if(data.length<1000)return records;
 }
 throw new Error("This workspace is too large to load in one view. Contact your administrator.");
}
export async function save(table:string,values:Record<string,unknown>,id?:string){
 const query=id ? db().from(table).update(values).eq("id",id) : db().from(table).insert(values);
 const {data,error}=await query.select().single();
 if(error)throw new Error(error.code==="23505" ? "This record already exists. Select or edit the existing one." : error.message);
 return data;
}
export async function remove(table:string,id:string){const {error}=await db().from(table).delete().eq("id",id);if(error)throw new Error(error.message);}
