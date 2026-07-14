import { describe, expect, test } from "bun:test";
import {
  mapNativeAuthorizationError,
  NativeError,
} from "../packages/macos/src/helpers/validation";

const AUTHORIZATION_ERROR_DOMAIN =
  "com.apple.AuthenticationServices.AuthorizationError";

describe("mapNativeAuthorizationError", () => {
  test("uses NativeError code/domain", () => {
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

  test("parses English NSError descriptions", () => {
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

  test("parses localized NSError descriptions", () => {
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

  test("defaults to NotAllowedError", () => {
    expect(mapNativeAuthorizationError(new Error("unknown failure"))).toBe(
      "NotAllowedError"
    );
    expect(mapNativeAuthorizationError({})).toBe("NotAllowedError");
  });

  test("maps cancellation to NotAllowedError", () => {
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
