import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationSecurityKeyPublicKeyCredentialProvider extends NobjcObject {
  /**
   * ASAuthorizationSecurityKeyPublicKeyCredentialProvider.init(relyingPartyIdentifier: String)
   * @private Do not use this method directly.
   */
  initWithRelyingPartyIdentifier$(
    relyingPartyIdentifier: NobjcObject
  ): _ASAuthorizationSecurityKeyPublicKeyCredentialProvider;

  // Create credential registration request
  createCredentialRegistrationRequestWithChallenge$name$userID$(
    challenge: NobjcObject,
    name: NobjcObject,
    userID: NobjcObject
  ): NobjcObject;

  /**
   * ASAuthorizationSecurityKeyPublicKeyCredentialProvider.createCredentialAssertionRequest(challenge: NSData)
   */
  createCredentialAssertionRequestWithChallenge$(
    challenge: NobjcObject
  ): NobjcObject;
}

export const ASAuthorizationSecurityKeyPublicKeyCredentialProvider =
  AuthenticationServices.ASAuthorizationSecurityKeyPublicKeyCredentialProvider as unknown as typeof _ASAuthorizationSecurityKeyPublicKeyCredentialProvider;

// Helper Functions

/**
 * Create an ASAuthorizationSecurityKeyPublicKeyCredentialProvider instance
 * @param relyingPartyIdentifier The relying party identifier (domain)
 * @returns An initialized provider instance
 */
export function createSecurityKeyPublicKeyCredentialProvider(
  relyingPartyIdentifier: NobjcObject
): _ASAuthorizationSecurityKeyPublicKeyCredentialProvider {
  const instance = (
    ASAuthorizationSecurityKeyPublicKeyCredentialProvider as any
  ).alloc();
  return instance.initWithRelyingPartyIdentifier$(relyingPartyIdentifier);
}
