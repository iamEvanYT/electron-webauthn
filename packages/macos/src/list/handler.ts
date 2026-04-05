import { bufferToBase64Url } from "../helpers/index.js";
import {
  createPasskeyAuthorizationManager,
  getListPasskeyAuthorizationStatus as getListPasskeyAuthorizationStatusInternal,
  requestListPasskeyAuthorization as requestListPasskeyAuthorizationInternal,
  resolvePasskeyAuthorization,
} from "../helpers/passkey-authorization.js";
import { ensureListPasskeysSupported } from "./support.js";
import { bufferFromNSDataDirect } from "objcjs-types/nsdata";
import { NSStringFromString } from "objcjs-types/helpers";
import {
  type _ASAuthorizationWebBrowserPlatformPublicKeyCredential,
  type _ASAuthorizationWebBrowserPublicKeyCredentialManager,
} from "objcjs-types/AuthenticationServices";
import type {
  ListPasskeysError,
  ListPasskeysOptions,
  ListPasskeysResult,
  PasskeyAuthorizationError,
  PasskeyAuthorizationResult,
  PasskeyCredential,
} from "@electron-webauthn/types";

const LOGGING_ENABLED = false;
function log(...args: Parameters<typeof console.log>) {
  if (!LOGGING_ENABLED) return;
  console.log(...args);
}

const AUTHORIZATION_DENIED_ERROR =
  "Authorization DENIED - user must grant permission in System Settings > Privacy & Security";
const AUTHORIZATION_NOT_DETERMINED_ERROR =
  "Authorization not determined. Call requestListPasskeyAuthorization() first or pass { requestAuthorization: true } to listPasskeys().";

async function getPlatformCredentials(
  manager: _ASAuthorizationWebBrowserPublicKeyCredentialManager,
  relyingPartyId: string
) {
  const rpIdString = NSStringFromString(relyingPartyId);
  log(
    `[listPasskeys] Calling platformCredentialsForRelyingParty: ${relyingPartyId}`
  );

  return new Promise<any>((resolve) => {
    manager.platformCredentialsForRelyingParty$completionHandler$(
      rpIdString,
      (credentialsArray) => {
        resolve(credentialsArray);
      }
    );
  });
}

function isExpectedListPasskeysError(error: Error) {
  return (
    error.message === AUTHORIZATION_DENIED_ERROR ||
    error.message === AUTHORIZATION_NOT_DETERMINED_ERROR
  );
}

export function getListPasskeyAuthorizationStatus(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  return getListPasskeyAuthorizationStatusInternal();
}

export function requestListPasskeyAuthorization(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  return requestListPasskeyAuthorizationInternal();
}

/**
 * List platform passkeys for a relying party ID using ASAuthorizationWebBrowserPublicKeyCredentialManager.
 *
 * Requires macOS 13.3+ and the com.apple.developer.web-browser.public-key-credential entitlement.
 *
 * @param relyingPartyId - The relying party identifier (e.g., "example.com")
 * @param options - Optional behavior flags for authorization prompting
 * @returns Promise that resolves with the list of credentials or rejects with an error
 *
 * @example
 * ```typescript
 * const result = await listPasskeys("example.com");
 * if (result.success) {
 *   console.log(`Found ${result.credentials.length} passkeys`);
 *   result.credentials.forEach(cred => {
 *     console.log(`- ${cred.userName} (${cred.id.substring(0, 20)}...)`);
 *   });
 * }
 * ```
 */
export async function listPasskeys(
  relyingPartyId: string,
  options: ListPasskeysOptions = {}
): Promise<ListPasskeysResult | ListPasskeysError> {
  try {
    ensureListPasskeysSupported();

    const manager = createPasskeyAuthorizationManager();
    const requestAuthorization = options.requestAuthorization ?? true;
    const authorizationStatus = await resolvePasskeyAuthorization({
      requestIfNeeded: requestAuthorization,
      manager,
    });

    log(`[listPasskeys] Authorization status: ${authorizationStatus}`);

    if (authorizationStatus === "denied") {
      throw new Error(AUTHORIZATION_DENIED_ERROR);
    }

    if (authorizationStatus === "notDetermined") {
      throw new Error(AUTHORIZATION_NOT_DETERMINED_ERROR);
    }

    // Get platform credentials for the relying party
    const credentialsArray = await getPlatformCredentials(
      manager,
      relyingPartyId
    );

    // Happens when you don't have the entitlement
    if (!credentialsArray) {
      throw new Error("Unknown error occurred");
    }

    const count = credentialsArray.count();
    log(`[listPasskeys] platformCredentials returned ${count} entries`);

    const credentials: PasskeyCredential[] = [];

    for (let i = 0; i < count; i++) {
      const cred = credentialsArray.objectAtIndex$(
        i
      ) as _ASAuthorizationWebBrowserPlatformPublicKeyCredential;

      // Extract credential properties
      const credentialIdData = cred.credentialID();
      const userName = cred.name().UTF8String();
      const userHandleData = cred.userHandle();

      // Convert NSData to base64url strings
      const credentialId = bufferToBase64Url(
        bufferFromNSDataDirect(credentialIdData)
      );
      const userHandle = bufferToBase64Url(
        bufferFromNSDataDirect(userHandleData)
      );

      log(
        `[listPasskeys] Found credential: name=${userName}, id=${credentialId.substring(
          0,
          20
        )}...`
      );

      credentials.push({
        id: credentialId,
        rpId: relyingPartyId,
        userName,
        userHandle,
      });
    }

    log(`[listPasskeys] Returning ${credentials.length} results`);
    return {
      success: true,
      credentials,
    };
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    if (!isExpectedListPasskeysError(normalizedError)) {
      console.error("[listPasskeys] ", normalizedError);
    }
    return {
      success: false,
      error: normalizedError,
    };
  }
}
