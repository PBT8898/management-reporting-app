export function text(value: unknown, name: string, required = true) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new Error(`${name} is required.`);
  if (result.length > 10000) throw new Error(`${name} is too long.`);
  return result;
}
export function number(value: unknown, name: string, min = -1e14, max = 1e14) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") throw new Error(`${name} must be a number.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return result;
}
export function choice(value: unknown, choices: string[], name: string) {
  const result = text(value, name);
  if (!choices.includes(result)) throw new Error(`Invalid ${name}.`);
  return result;
}
export function uuid(value: unknown) {
  const result = text(value, "Record ID");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result)) throw new Error("Invalid record ID.");
  return result;
}
