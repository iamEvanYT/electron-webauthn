import type { _NSData } from "../foundation/nsdata.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput extends NobjcObject {
  /**
   * ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput.init(largeBlob: NSData)
   * @private Do not use this method directly.
   */
  initWithOperation$(
    operation: number
  ): _ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput;

  setDataToWrite$(data: _NSData): void;
}

export const ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput as unknown as typeof _ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput;

// Helper Functions

/**
 * Create an ASAuthorizationController instance
 * @param authorizationRequests An NSArray of authorization requests
 * @returns An initialized controller instance
 */
export function createASAuthorizationPublicKeyCredentialLargeBlobAssertionInput(
  operation: number
): _ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput {
  const instance = (
    ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput as any
  ).alloc();
  return instance.initWithOperation$(operation);
}
