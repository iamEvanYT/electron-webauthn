import type { _NSData } from "../foundation/nsdata.js";
import type { _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues } from "./as-authorization-public-key-credential-prf-assertion-input-valuesas-authorization-public-key-credential-prf-assertion-input-values.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationPublicKeyCredentialPRFAssertionInput extends NobjcObject {
  /**
   * ASAuthorizationPublicKeyCredentialPRFAssertionInput.init(prf: NSData)
   * @private Do not use this method directly.
   */
  initWithInputValues$perCredentialInputValues$(
    operation: number
  ): _ASAuthorizationPublicKeyCredentialPRFAssertionInput;
}

export const ASAuthorizationPublicKeyCredentialPRFAssertionInput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialPRFAssertionInput as unknown as typeof _ASAuthorizationPublicKeyCredentialPRFAssertionInput;

// Helper Functions

/**
 * Create an ASAuthorizationPublicKeyCredentialPRFAssertionInput instance
 * @param inputValues The input values
 * @param perCredentialInputValues The per credential input values
 * @returns An initialized assertion input instance
 */
export function createASAuthorizationPublicKeyCredentialPRFAssertionInput(
  inputValues: _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues | null,
  perCredentialInputValues: NobjcObject | null // NSDictionary<NSData, ASAuthorizationPublicKeyCredentialPRFAssertionInputValues>
): _ASAuthorizationPublicKeyCredentialPRFAssertionInput {
  const instance = (
    ASAuthorizationPublicKeyCredentialPRFAssertionInput as any
  ).alloc();
  return instance.initWithInputValues$perCredentialInputValues$(
    inputValues,
    perCredentialInputValues
  );
}
