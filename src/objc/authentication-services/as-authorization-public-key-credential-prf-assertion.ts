import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";
import type { _NSData } from "../foundation/nsdata.js";

declare class _ASAuthorizationPublicKeyCredentialPRFAssertionOutput extends NobjcObject {
  first(): _NSData;

  second(): _NSData;
}

export const ASAuthorizationPublicKeyCredentialPRFAssertionOutput =
  AuthenticationServices.ASAuthorizationPublicKeyCredentialPRFAssertionOutput as unknown as typeof _ASAuthorizationPublicKeyCredentialPRFAssertionOutput;

export type { _ASAuthorizationPublicKeyCredentialPRFAssertionOutput };
