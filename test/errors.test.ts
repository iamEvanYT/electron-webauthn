import { describe, expect, test } from "bun:test";
import {
  mapCreateAuthorizationError,
  type NativeAuthorizationError,
} from "../packages/macos/src/helpers/errors";

function nativeError(message: string, code: number, domain: string) {
  const error: NativeAuthorizationError = new Error(message);
  error.code = code;
  error.domain = domain;
  return error;
}

const DOMAIN = "com.apple.AuthenticationServices.AuthorizationError";

describe("mapCreateAuthorizationError", () => {
  test("maps a matched excluded credential to InvalidStateError regardless of language", () => {
    expect(
      mapCreateAuthorizationError(nativeError("操作无法完成。", 1006, DOMAIN))
    ).toBe("InvalidStateError");
  });

  test("maps other native errors to NotAllowedError", () => {
    expect(
      mapCreateAuthorizationError(nativeError("canceled", 1001, DOMAIN))
    ).toBe("NotAllowedError");
    expect(
      mapCreateAuthorizationError(nativeError("other", 1006, "other.domain"))
    ).toBe("NotAllowedError");
  });

  test("falls back to the message for errors without a code", () => {
    expect(
      mapCreateAuthorizationError(
        new Error(`(${DOMAIN} error 1006.)`)
      )
    ).toBe("InvalidStateError");
    expect(mapCreateAuthorizationError(new Error("boom"))).toBe(
      "NotAllowedError"
    );
  });
});
