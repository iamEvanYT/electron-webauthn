export function isString(value: unknown): value is string {
  return value && typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return value && typeof value === "number";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value && typeof value === "object";
}
