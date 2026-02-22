import { bufferToBase64Url, PromiseWithResolvers } from "../helpers/index.js";
import { bufferFromNSDataDirect } from "objcjs-types/nsdata";
import { NSStringFromString } from "objcjs-types/helpers";
import {
  ASAuthorizationWebBrowserPublicKeyCredentialManager,
  ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState,
  type _ASAuthorizationWebBrowserPlatformPublicKeyCredential,
  type _ASAuthorizationWebBrowserPublicKeyCredentialManager,
} from "objcjs-types/AuthenticationServices";
import {
  isAtLeast,
  version,
  formatVersion,
  getOSVersion,
} from "objcjs-types/osversion";
import type {
  PasskeyCredential,
  ListPasskeysResult,
  ListPasskeysError,
} from "./types.js";
import { enumFromValue, makePromise1Result } from "objcjs-types/helpers";

const LOGGING_ENABLED = false;
function log(...args: Parameters<typeof console.log>) {
  if (!LOGGING_ENABLED) return;
  console.log(...args);
}

/**
 * List platform passkeys for a relying party ID using ASAuthorizationWebBrowserPublicKeyCredentialManager.
 *
 * Requires macOS 13.5+ and the com.apple.developer.web-browser.public-key-credential entitlement.
 *
 * @param relyingPartyId - The relying party identifier (e.g., "example.com")
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
  relyingPartyId: string
): Promise<ListPasskeysResult | ListPasskeysError> {
  try {
    // Check macOS version requirement (13.3+)
    const minVersion = version(13, 3);
    if (!isAtLeast(minVersion)) {
      const currentVersion = getOSVersion();
      throw new Error(
        `Passkey listing requires macOS 13.3 or later (current: ${formatVersion(
          currentVersion
        )})`
      );
    }

    // Create the manager instance
    const manager =
      ASAuthorizationWebBrowserPublicKeyCredentialManager.alloc().init();

    // Check authorization state
    const authState = manager.authorizationStateForPlatformCredentials();
    log(`[listPasskeys] Authorization state: ${authState}`);
    // 0 = authorized, 1 = denied, 2 = notDetermined

    if (
      authState ===
      ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState.NotDetermined
    ) {
      // notDetermined
      log("[listPasskeys] Authorization not determined, requesting...");

      // Request authorization with completion handler
      const newStateValue = await makePromise1Result(
        manager.requestAuthorizationForPublicKeyCredentials$.bind(manager)
      );
      const newState = enumFromValue(
        ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState,
        newStateValue
      );
      log(
        `[listPasskeys] Authorization request completed, new state: ${newState}`
      );
    } else if (
      authState ===
      ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState.Denied
    ) {
      // denied
      throw new Error(
        "Authorization DENIED - user must grant permission in System Settings > Privacy & Security"
      );
    } else {
      log("[listPasskeys] Authorization already granted");
    }

    // Get platform credentials for the relying party
    const rpIdString = NSStringFromString(relyingPartyId);
    log(
      `[listPasskeys] Calling platformCredentialsForRelyingParty: ${relyingPartyId}`
    );
    const credentialsArray = await makePromise1Result(
      manager.platformCredentialsForRelyingParty$completionHandler$.bind(
        manager
      ),
      rpIdString
    );

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
    console.error("[listPasskeys] ", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
