import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";
import type { _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput } from "./as-authorization-public-key-credential-large-blob-registration-output.js";
import type { _NSData } from "../foundation/nsdata.js";
import type { ASAuthorizationPublicKeyCredentialAttachment } from "./enums/as-authorization-public-key-credential-attachment.js";

/**
 * ASAuthorizationPlatformPublicKeyCredentialRegistration
 *
 * A credential that's generated during registration with a platform authenticator.
 * https://developer.apple.com/documentation/authenticationservices/asauthorizationplatformpublickeycredentialregistration?language=objc
 *
 * This class represents the result of a successful registration ceremony using a platform
 * authenticator (like Touch ID or Face ID). It contains the credential data needed by the
 * relying party to verify and store the credential.
 */
declare class _ASAuthorizationPlatformPublicKeyCredentialRegistration extends NobjcObject {
  /**
   * The type of authenticator used to create the credential.
   *
   * @returns The attachment type (platform or cross-platform)
   */
  attachment(): ASAuthorizationPublicKeyCredentialAttachment;

  /**
   * The output of a large blob storage operation during registration.
   *
   * @returns The large blob registration output, or nil if large blob was not used
   */
  largeBlob(): _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput;

  /**
   * The raw client data JSON.
   *
   * This is the JSON-serialized client data that was signed during the registration ceremony.
   * It contains information about the origin, challenge, and other contextual data.
   *
   * @returns NSData containing the raw client data JSON
   */
  rawClientDataJSON(): _NSData;

  /**
   * The credential identifier.
   *
   * This is the unique identifier for the newly created credential. The relying party
   * should store this identifier and use it to identify the credential in future
   * authentication ceremonies.
   *
   * @returns NSData containing the credential ID
   */
  credentialID(): _NSData;

  /**
   * The attestation object.
   *
   * This contains the attestation statement and authenticator data. The relying party
   * can use this to verify the authenticity of the authenticator and the credential.
   *
   * @returns NSData containing the attestation object
   */
  rawAttestationObject(): _NSData;
}

export const ASAuthorizationPlatformPublicKeyCredentialRegistration =
  AuthenticationServices.ASAuthorizationPlatformPublicKeyCredentialRegistration as unknown as typeof _ASAuthorizationPlatformPublicKeyCredentialRegistration;

export type { _ASAuthorizationPlatformPublicKeyCredentialRegistration };
