import { ASAuthorizationPublicKeyCredentialPRFAssertionInputValues } from "objcjs-types/AuthenticationServices";
import { NSDataFromBuffer } from "objcjs-types/nsdata";

export interface PRFInput {
  first: Buffer;
  second?: Buffer;
}

export function createPRFInput(prf: PRFInput) {
  return ASAuthorizationPublicKeyCredentialPRFAssertionInputValues.alloc().initWithSaltInput1$saltInput2$(
    NSDataFromBuffer(prf.first),
    prf.second ? NSDataFromBuffer(prf.second) : null
  );
}
