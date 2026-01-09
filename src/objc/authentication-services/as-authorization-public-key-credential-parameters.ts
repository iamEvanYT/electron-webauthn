import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

/**
 * ASAuthorizationPublicKeyCredentialParameters
 *
 * A public key credential parameter that specifies an algorithm for creating credentials.
 * https://developer.apple.com/documentation/authenticationservices/asauthorizationpublickeycredentialparameters?language=objc
 *
 * This class specifies the cryptographic algorithm to use when creating a credential.
 * It's typically used during registration to indicate which algorithms the relying party supports.
 */
declare class _ASAuthorizationPublicKeyCredentialParameters extends NobjcObject {
  /**
   * Creates a credential parameter with the specified algorithm identifier.
   *
   * @param algorithm The COSE algorithm identifier as NSNumber
   * @returns An initialized credential parameter
   * @private Do not use this method directly. Use the helper function instead.
   */
  initWithAlgorithm$(
    algorithm: number
  ): _ASAuthorizationPublicKeyCredentialParameters;

  /**
   * The algorithm identifier.
   *
   * This is a COSE algorithm identifier (e.g., -7 for ES256, -257 for RS256).
   *
   * @returns NSNumber containing the algorithm identifier
   */
  algorithm(): number;
}

export const ASAuthorizationPublicKeyCredentialParameters =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialParameters as unknown as typeof _ASAuthorizationPublicKeyCredentialParameters;

export type { _ASAuthorizationPublicKeyCredentialParameters };

/**
 * Helper function to create an ASAuthorizationPublicKeyCredentialParameters instance
 *
 * @param algorithm NSNumber representing the COSE algorithm identifier
 * @returns An initialized ASAuthorizationPublicKeyCredentialParameters
 */
export function createASAuthorizationPublicKeyCredentialParameters(
  algorithm: number
): _ASAuthorizationPublicKeyCredentialParameters {
  const instance = (
    ASAuthorizationPublicKeyCredentialParameters as any
  ).alloc();
  return instance.initWithAlgorithm$(algorithm);
}
