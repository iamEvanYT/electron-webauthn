import { afterEach, describe, expect, test } from "bun:test";
import {
  __setPasskeyAuthorizationManagerFactoryForTesting,
  getListPasskeyAuthorizationStatus,
  requestListPasskeyAuthorization,
  resolvePasskeyAuthorization,
} from "../packages/macos/src/helpers/passkey-authorization";

const AUTHORIZED = 0;
const DENIED = 1;
const NOT_DETERMINED = 2;

function createFakeManager(
  authorizationState: number,
  requestState = authorizationState
) {
  let currentState = authorizationState;
  let requestCount = 0;

  return {
    manager: {
      authorizationStateForPlatformCredentials() {
        return currentState;
      },
      requestAuthorizationForPublicKeyCredentials$(
        completion: (state: number) => void
      ) {
        requestCount += 1;
        currentState = requestState;
        completion(currentState);
      },
    } as any,
    getRequestCount() {
      return requestCount;
    },
  };
}

afterEach(() => {
  __setPasskeyAuthorizationManagerFactoryForTesting(null);
});

describe("passkey authorization helper", () => {
  test("maps authorized status without requesting", async () => {
    const fakeManager = createFakeManager(AUTHORIZED);
    __setPasskeyAuthorizationManagerFactoryForTesting(
      () => fakeManager.manager
    );

    const result = await getListPasskeyAuthorizationStatus();

    expect(result).toEqual({ success: true, status: "authorized" });
    expect(fakeManager.getRequestCount()).toBe(0);
  });

  test("maps denied status without requesting", async () => {
    const fakeManager = createFakeManager(DENIED);
    __setPasskeyAuthorizationManagerFactoryForTesting(
      () => fakeManager.manager
    );

    const result = await getListPasskeyAuthorizationStatus();

    expect(result).toEqual({ success: true, status: "denied" });
    expect(fakeManager.getRequestCount()).toBe(0);
  });

  test("returns notDetermined without requesting when requestIfNeeded is false", async () => {
    const fakeManager = createFakeManager(NOT_DETERMINED, AUTHORIZED);
    __setPasskeyAuthorizationManagerFactoryForTesting(
      () => fakeManager.manager
    );

    const status = await resolvePasskeyAuthorization({
      requestIfNeeded: false,
    });

    expect(status).toBe("notDetermined");
    expect(fakeManager.getRequestCount()).toBe(0);
  });

  test("requests authorization only when needed and normalizes the result", async () => {
    const fakeManager = createFakeManager(NOT_DETERMINED, AUTHORIZED);
    __setPasskeyAuthorizationManagerFactoryForTesting(
      () => fakeManager.manager
    );

    const result = await requestListPasskeyAuthorization();

    expect(result).toEqual({ success: true, status: "authorized" });
    expect(fakeManager.getRequestCount()).toBe(1);
  });

  test("does not re-request authorization after denial", async () => {
    const fakeManager = createFakeManager(DENIED, AUTHORIZED);
    __setPasskeyAuthorizationManagerFactoryForTesting(
      () => fakeManager.manager
    );

    const result = await requestListPasskeyAuthorization();

    expect(result).toEqual({ success: true, status: "denied" });
    expect(fakeManager.getRequestCount()).toBe(0);
  });
});
