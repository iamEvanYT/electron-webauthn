import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

/**
 * ASAuthorization
 *
 * An authorization that a user grants to your app.
 * https://developer.apple.com/documentation/authenticationservices/asauthorization?language=objc
 *
 * This class represents the result of a successful authorization request.
 * It contains the credential that was authorized and the provider that created it.
 */
declare class _ASAuthorization extends NobjcObject {
  /**
   * The credential that the user authorized.
   *
   * The type of credential depends on the authorization request:
   * - ASAuthorizationPlatformPublicKeyCredentialAssertion for platform credential assertions
   * - ASAuthorizationPlatformPublicKeyCredentialRegistration for platform credential registrations
   * - ASAuthorizationSecurityKeyPublicKeyCredentialAssertion for security key assertions
   * - ASAuthorizationSecurityKeyPublicKeyCredentialRegistration for security key registrations
   * - ASAuthorizationAppleIDCredential for Sign in with Apple
   * - ASAuthorizationPasswordCredential for password credentials
   * - ASAuthorizationSingleSignOnCredential for single sign-on
   *
   * @returns The credential object
   */
  credential(): NobjcObject;

  /**
   * The authorization provider that created the credential.
   *
   * This is typically one of:
   * - ASAuthorizationPlatformPublicKeyCredentialProvider
   * - ASAuthorizationSecurityKeyPublicKeyCredentialProvider
   * - ASAuthorizationAppleIDProvider
   * - ASAuthorizationPasswordProvider
   *
   * @returns The provider object
   */
  provider(): NobjcObject;
}

export const ASAuthorization =
  AuthenticationServices.ASAuthorization as unknown as typeof _ASAuthorization;

export type { _ASAuthorization };
