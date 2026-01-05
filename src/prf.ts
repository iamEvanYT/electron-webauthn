import { createASAuthorizationPublicKeyCredentialPRFAssertionInputValues } from "./objc/authentication-services/as-authorization-public-key-credential-prf-assertion-input-valuesas-authorization-public-key-credential-prf-assertion-input-values.js";
import { NSDataFromBuffer } from "./objc/foundation/nsdata.js";

export interface PRFInput {
  first: Buffer;
  second?: Buffer;
}

export function createPRFInput(prf: PRFInput) {
  return createASAuthorizationPublicKeyCredentialPRFAssertionInputValues(
    NSDataFromBuffer(prf.first),
    prf.second ? NSDataFromBuffer(prf.second) : null
  );
}
