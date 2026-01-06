import type { _NSData } from "../foundation/nsdata.js";
import type { _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues } from "./as-authorization-public-key-credential-prf-assertion-input-valuesas-authorization-public-key-credential-prf-assertion-input-values.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationPublicKeyCredentialPRFRegistrationInput extends NobjcObject {
  /**
   * ASAuthorizationPublicKeyCredentialPRFRegistrationInput.initWithInputValues()
   * @private Do not use this method directly.
   */
  initWithInputValues$(
    inputValues: NobjcObject | null
  ): _ASAuthorizationPublicKeyCredentialPRFRegistrationInput;

  /**
   * A check to determine extension support for the newly created passkey.
   */
  static checkForSupport(): NobjcObject;
}

export const ASAuthorizationPublicKeyCredentialPRFRegistrationInput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialPRFRegistrationInput as unknown as typeof _ASAuthorizationPublicKeyCredentialPRFRegistrationInput;

export type { _ASAuthorizationPublicKeyCredentialPRFRegistrationInput };

// Helper Functions

/**
 * Create an ASAuthorizationPublicKeyCredentialPRFRegistrationInput instance
 * @param inputValues Optional input values for PRF registration (typically null to just check for support)
 * @returns An initialized registration input instance
 */
export function createASAuthorizationPublicKeyCredentialPRFRegistrationInput(
  inputValues: _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues
): _ASAuthorizationPublicKeyCredentialPRFRegistrationInput {
  const instance = (
    ASAuthorizationPublicKeyCredentialPRFRegistrationInput as any
  ).alloc();
  return instance.initWithInputValues$(inputValues);
}
