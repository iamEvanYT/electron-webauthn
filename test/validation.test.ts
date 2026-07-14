import { describe, expect, test } from "bun:test";
import {
  isNumber,
  isString,
  mapNativeAuthorizationError,
  NativeError,
} from "../packages/macos/src/helpers/validation";

const AUTHORIZATION_ERROR_DOMAIN =
  "com.apple.AuthenticationServices.AuthorizationError";

describe("validation helpers", () => {
  test("isString accepts empty string", () => {
    expect(isString("")).toBe(true);
    expect(isString("rp.example")).toBe(true);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });

  test("isNumber rejects non-finite numbers", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(1000)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(null)).toBe(false);
  });

  test("mapNativeAuthorizationError uses NativeError code/domain", () => {
    expect(
      mapNativeAuthorizationError(
        new NativeError("excluded", {
          domain: AUTHORIZATION_ERROR_DOMAIN,
          code: 1006,
        })
      )
    ).toBe("InvalidStateError");

    expect(
      mapNativeAuthorizationError(
        new NativeError("cancelled", {
          domain: AUTHORIZATION_ERROR_DOMAIN,
          code: 1001,
        })
      )
    ).toBe("NotAllowedError");
  });

  test("mapNativeAuthorizationError parses English NSError descriptions", () => {
    expect(
      mapNativeAuthorizationError(
        new Error(
          "The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error 1006.)"
        )
      )
    ).toBe("InvalidStateError");

    expect(
      mapNativeAuthorizationError(
        new Error(
          "The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)"
        )
      )
    ).toBe("NotAllowedError");
  });

  test("mapNativeAuthorizationError parses localized NSError descriptions", () => {
    expect(
      mapNativeAuthorizationError(
        new Error(
          "操作无法完成。（com.apple.AuthenticationServices.AuthorizationError错误1006。）"
        )
      )
    ).toBe("InvalidStateError");

    expect(
      mapNativeAuthorizationError(
        new Error(
          "操作无法完成。（com.apple.AuthenticationServices.AuthorizationError错误1001。）"
        )
      )
    ).toBe("NotAllowedError");
  });

  test("mapNativeAuthorizationError defaults to NotAllowedError", () => {
    expect(mapNativeAuthorizationError(new Error("unknown failure"))).toBe(
      "NotAllowedError"
    );
    expect(mapNativeAuthorizationError({})).toBe("NotAllowedError");
  });

  test("mapNativeAuthorizationError maps cancellation to NotAllowedError", () => {
    expect(
      mapNativeAuthorizationError(
        new NativeError("cancelled", {
          domain: AUTHORIZATION_ERROR_DOMAIN,
          code: 1001,
        })
      )
    ).toBe("NotAllowedError");
  });
});
