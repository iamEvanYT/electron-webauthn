import type { _NSData } from "../foundation/nsdata.js";
import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
export declare class _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput extends NobjcObject {
  /**
   * Indicates whether the large blob storage is supported.
   * @returns true if large blob storage is supported, false otherwise
   */
  isSupported(): boolean;
}

export const ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput as unknown as typeof _ASAuthorizationPublicKeyCredentialLargeBlobRegistrationOutput;
