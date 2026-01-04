import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";
import type { _ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput } from "./as-authorization-public-key-credential-large-blob-assertion.js";
import type { _ASAuthorizationPublicKeyCredentialPRFAssertionOutput } from "./as-authorization-public-key-credential-prf-assertion.js";
import type { _NSData } from "../foundation/nsdata.js";
import type { ASAuthorizationPublicKeyCredentialAttachment } from "./enums/as-authorization-public-key-credential-attachment.js";

declare class _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion extends NobjcObject {
  attachment(): ASAuthorizationPublicKeyCredentialAttachment;

  largeBlob(): _ASAuthorizationPublicKeyCredentialLargeBlobAssertionOutput;

  prf(): _ASAuthorizationPublicKeyCredentialPRFAssertionOutput;

  rawClientDataJSON(): _NSData;

  credentialID(): _NSData;

  rawAuthenticatorData(): _NSData;

  userID(): _NSData;

  signature(): _NSData;
}

export const ASAuthorizationSecurityKeyPublicKeyCredentialAssertion =
  AuthenticationServices.ASAuthorizationSecurityKeyPublicKeyCredentialAssertion as unknown as typeof _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion;

export type { _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion };
