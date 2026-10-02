import { rows, save, remove } from "./db";
import type { Property } from "./types";
export const listProperties = () => rows<Property>("properties", "name");
export const saveProperty = (values: Record<string, unknown>, id?: string) => save("properties", values, id);
export const deleteProperty = (id: string) => remove("properties", id);
