import { describe, expect, test } from "bun:test";
import { isNumber, isString } from "../packages/macos/src/helpers/validation";
import { isRpIdAllowedForOrigin } from "../packages/macos/src/helpers/rpid";

describe("isString", () => {
  test("accepts strings, including the empty string", () => {
    expect(isString("abc")).toBe(true);
    expect(isString("")).toBe(true);
  });

  test("rejects non-strings", () => {
    for (const value of [undefined, null, 0, 1, {}, [], true]) {
      expect(isString(value)).toBe(false);
    }
  });
});

describe("isNumber", () => {
  test("accepts finite numbers, including zero", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-7)).toBe(true);
    expect(isNumber(1.5)).toBe(true);
  });

  test("rejects NaN, Infinity and non-numbers", () => {
    for (const value of [NaN, Infinity, -Infinity, "1", undefined, null, {}]) {
      expect(isNumber(value)).toBe(false);
    }
  });
});

describe("empty rpId", () => {
  test("is still rejected by the rpId origin check", () => {
    expect(isRpIdAllowedForOrigin("https://example.com", "").ok).toBe(false);
  });
});
