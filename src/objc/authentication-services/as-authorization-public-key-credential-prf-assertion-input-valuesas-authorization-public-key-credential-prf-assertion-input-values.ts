import type { _NSData } from "../foundation/nsdata.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
export declare class _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues extends NobjcObject {
  /**
   * ASAuthorizationPublicKeyCredentialPRFAssertionInput.init(prf: NSData)
   * @private Do not use this method directly.
   */
  initWithSaltInput1$saltInput2$(
    saltInput1: _NSData,
    saltInput2: _NSData
  ): _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues;
}

export const ASAuthorizationPublicKeyCredentialPRFAssertionInputValues =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialPRFAssertionInputValues as unknown as typeof _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues;

// Helper Functions

/**
 * Create an ASAuthorizationPublicKeyCredentialPRFAssertionInputValues instance
 * @param inputValues The input values
 * @param perCredentialInputValues The per credential input values
 * @returns An initialized assertion input instance
 */
export function createASAuthorizationPublicKeyCredentialPRFAssertionInputValues(
  saltInput1: _NSData,
  saltInput2: _NSData | null
): _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues {
  const instance = (
    ASAuthorizationPublicKeyCredentialPRFAssertionInputValues as any
  ).alloc();
  console.log("saltInput1", saltInput1);
  console.log("saltInput2", saltInput2);
  return instance.initWithSaltInput1$saltInput2$(saltInput1, saltInput2);
}
