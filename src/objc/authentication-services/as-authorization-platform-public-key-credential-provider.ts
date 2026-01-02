import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationPlatformPublicKeyCredentialProvider extends NobjcObject {
  /**
   * ASAuthorizationPlatformPublicKeyCredentialProvider.init(relyingPartyIdentifier: String)
   * @private Do not use this method directly.
   */
  initWithRelyingPartyIdentifier$(
    relyingPartyIdentifier: NobjcObject
  ): _ASAuthorizationPlatformPublicKeyCredentialProvider;

  // Create credential registration request
  createCredentialRegistrationRequestWithChallenge$name$userID$(
    challenge: NobjcObject,
    name: NobjcObject,
    userID: NobjcObject
  ): NobjcObject;

  /**
   * ASAuthorizationPlatformPublicKeyCredentialProvider.createCredentialAssertionRequest(challenge: NSData)
   */
  createCredentialAssertionRequestWithChallenge$(
    challenge: NobjcObject
  ): NobjcObject;
}

export const ASAuthorizationPlatformPublicKeyCredentialProvider =
  AuthenticationServices.ASAuthorizationPlatformPublicKeyCredentialProvider as unknown as typeof _ASAuthorizationPlatformPublicKeyCredentialProvider;

// Helper Functions

/**
 * Create an ASAuthorizationPlatformPublicKeyCredentialProvider instance
 * @param relyingPartyIdentifier The relying party identifier (domain)
 * @returns An initialized provider instance
 */
export function createPlatformPublicKeyCredentialProvider(
  relyingPartyIdentifier: NobjcObject
): _ASAuthorizationPlatformPublicKeyCredentialProvider {
  const instance = (
    ASAuthorizationPlatformPublicKeyCredentialProvider as any
  ).alloc();
  return instance.initWithRelyingPartyIdentifier$(relyingPartyIdentifier);
}
