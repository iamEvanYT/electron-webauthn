/**
 * ASAuthorizationPublicKeyCredentialAttestationKind
 *
 * Constants that describe the attestation type the relying party prefers.
 * These are NSString constants in Objective-C.
 * @see https://developer.apple.com/documentation/authenticationservices/asauthorizationpublickeycredentialattestationkind?language=objc
 */
export const enum ASAuthorizationPublicKeyCredentialAttestationKind {
  /**
   * A value that indicates the relying party wants to receive the attestation statement from the authenticator.
   */
  Direct = "direct",

  /**
   * A value that indicates the relying party wants to receive an attestation statement that may include
   * uniquely identifying information.
   */
  Enterprise = "enterprise",

  /**
   * A value that indicates the relying party prefers attestation, but allows the client to decide.
   */
  Indirect = "indirect",

  /**
   * A value that indicates the relying party isn't interested in authenticator attestation.
   */
  None = "none",
}
