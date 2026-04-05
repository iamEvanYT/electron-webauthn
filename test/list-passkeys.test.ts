import { afterEach, describe, expect, test } from "bun:test";
import { NSStringFromString } from "../packages/macos/node_modules/objcjs-types/dist/helpers.js";
import { NSDataFromBuffer } from "../packages/macos/node_modules/objcjs-types/dist/nsdata.js";
import { __setPasskeyAuthorizationManagerFactoryForTesting } from "../packages/macos/src/helpers/passkey-authorization";
import { listPasskeys } from "../packages/macos/src/list/handler";
import { __setListPasskeysSupportOverrideForTesting } from "../packages/macos/src/list/support";

const AUTHORIZED = 0;
const NOT_DETERMINED = 2;

function createFakeCredentialsArray() {
  const credentials = [
    {
      credentialID() {
        return NSDataFromBuffer(Buffer.from("credential-id"));
      },
      name() {
        return NSStringFromString("alice@example.com");
      },
      userHandle() {
        return NSDataFromBuffer(Buffer.from("user-handle"));
      },
    },
  ];

  return {
    count() {
      return credentials.length;
    },
    objectAtIndex$(index: number) {
      return credentials[index];
    },
  } as any;
}

function createFakeManager({
  authorizationState,
  requestState = authorizationState,
  credentialsArray = null,
  onRequest,
}: {
  authorizationState: number;
  requestState?: number;
  credentialsArray?: any;
  onRequest?: () => void;
}) {
  let currentState = authorizationState;

  return {
    authorizationStateForPlatformCredentials() {
      return currentState;
    },
    requestAuthorizationForPublicKeyCredentials$(
      completion: (state: number) => void
    ) {
      onRequest?.();
      currentState = requestState;
      completion(currentState);
    },
    platformCredentialsForRelyingParty$completionHandler$(
      _rpId: unknown,
      completion: (credentials: any) => void
    ) {
      completion(credentialsArray);
    },
  } as any;
}

afterEach(() => {
  __setPasskeyAuthorizationManagerFactoryForTesting(null);
  __setListPasskeysSupportOverrideForTesting(null);
});

describe("listPasskeys authorization behavior", () => {
  test("requests authorization by default before listing passkeys", async () => {
    __setListPasskeysSupportOverrideForTesting(true);

    let requestCount = 0;
    __setPasskeyAuthorizationManagerFactoryForTesting(() =>
      createFakeManager({
        authorizationState: NOT_DETERMINED,
        requestState: AUTHORIZED,
        credentialsArray: createFakeCredentialsArray(),
        onRequest() {
          requestCount += 1;
        },
      })
    );

    const result = await listPasskeys("example.com");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.credentials).toHaveLength(1);
      expect(result.credentials[0]).toMatchObject({
        rpId: "example.com",
        userName: "alice@example.com",
      });
    }
    expect(requestCount).toBe(1);
  });

  test("skips the authorization prompt when requestAuthorization is false", async () => {
    __setListPasskeysSupportOverrideForTesting(true);

    let requestCount = 0;
    __setPasskeyAuthorizationManagerFactoryForTesting(() =>
      createFakeManager({
        authorizationState: NOT_DETERMINED,
        requestState: AUTHORIZED,
        onRequest() {
          requestCount += 1;
        },
      })
    );

    const result = await listPasskeys("example.com", {
      requestAuthorization: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "requestListPasskeyAuthorization()"
      );
    }
    expect(requestCount).toBe(0);
  });
});
