import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";
import type { _NSData } from "../foundation/nsdata.js";

declare class _ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput extends NobjcObject {
  readData(): _NSData;

  didWrite(): boolean;
}

export const ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput as unknown as typeof _ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput;

export type { _ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput };
