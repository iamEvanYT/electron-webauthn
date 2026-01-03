import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

/**
 * ASAuthorizationPlatformPublicKeyCredentialDescriptor
 *
 * A descriptor that identifies a public key credential.
 * https://developer.apple.com/documentation/authenticationservices/asauthorizationplatformpublickeycredentialdescriptor?language=objc
 *
 * This class is used to specify which credentials are acceptable for authentication.
 * It's typically used in assertion requests to indicate which credentials the relying
 * party is willing to accept.
 */
declare class _ASAuthorizationPlatformPublicKeyCredentialDescriptor extends NobjcObject {
  /**
   * Creates a credential descriptor with the specified credential identifier.
   *
   * @param credentialID The credential identifier as NSData
   * @returns An initialized credential descriptor
   * @private Do not use this method directly. Use the helper function instead.
   */
  initWithCredentialID$(
    credentialID: NobjcObject
  ): _ASAuthorizationPlatformPublicKeyCredentialDescriptor;

  /**
   * The credential identifier.
   *
   * This is the unique identifier for the credential, typically obtained
   * during the registration process.
   *
   * @returns NSData containing the credential ID
   */
  credentialID(): NobjcObject;
}

export const ASAuthorizationPlatformPublicKeyCredentialDescriptor =
  AuthenticationServices.ASAuthorizationPlatformPublicKeyCredentialDescriptor as unknown as typeof _ASAuthorizationPlatformPublicKeyCredentialDescriptor;

export type { _ASAuthorizationPlatformPublicKeyCredentialDescriptor };

// Helper Functions

/**
 * Create an ASAuthorizationPlatformPublicKeyCredentialDescriptor instance
 * @param credentialID The credential identifier (NSData)
 * @returns An initialized credential descriptor
 */
export function createPlatformPublicKeyCredentialDescriptor(
  credentialID: NobjcObject
): _ASAuthorizationPlatformPublicKeyCredentialDescriptor {
  const instance = (
    ASAuthorizationPlatformPublicKeyCredentialDescriptor as any
  ).alloc();
  return instance.initWithCredentialID$(credentialID);
}
