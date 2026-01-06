import type { _NSData } from "../foundation/nsdata.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput extends NobjcObject {
  /**
   * ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput.init(supportRequirement: NSString)
   * @private Do not use this method directly.
   */
  initWithSupportRequirement$(
    supportRequirement: number
  ): _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput;
}

export const ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput as unknown as typeof _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput;

// Helper Functions

/**
 * Create an ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput instance
 * @param supportRequirement The support requirement (0 = required, 1 = preferred)
 * @returns An initialized registration input instance
 */
export function createASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput(
  supportRequirement: number
): _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput {
  const instance = (
    ASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput as any
  ).alloc();
  return instance.initWithSupportRequirement$(supportRequirement);
}
