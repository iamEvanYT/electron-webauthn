/**
 * ASAuthorizationPublicKeyCredentialUserVerificationPreference
 *
 * Constants that describe the relying party's requirements for user verification.
 * These are NSString constants in Objective-C.
 * @see https://developer.apple.com/documentation/authenticationservices/asauthorizationpublickeycredentialuserverificationpreference?language=objc
 */
export const enum ASAuthorizationPublicKeyCredentialUserVerificationPreference {
  /**
   * A value that indicates the relying party prefers user verification if possible, but allows the operation to proceed without it.
   */
  Discouraged = "discouraged",

  /**
   * A value that indicates the relying party prefers user verification, but allows the operation to proceed without it.
   */
  Preferred = "preferred",

  /**
   * A value that indicates the relying party requires user verification and will fail the operation if it cannot be performed.
   */
  Required = "required",
}
