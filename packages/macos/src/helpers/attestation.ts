import { decodeCBORToNativeValueNoLeftoverBytes } from "@oslojs/cbor";

/**
 * Extracts the raw authenticator data bytes from a CBOR-encoded attestation object.
 * This is what `AuthenticatorAttestationResponse.getAuthenticatorData()` must return.
 */
export function extractRawAuthenticatorData(attestationObject: Buffer): Buffer {
  const decoded = decodeCBORToNativeValueNoLeftoverBytes(attestationObject, 16);
  if (
    !decoded ||
    typeof decoded !== "object" ||
    !(decoded as Record<string, unknown>).authData
  ) {
    throw new Error("Attestation object does not contain authData");
  }

  const authData = (decoded as Record<string, unknown>).authData;
  if (!(authData instanceof Uint8Array)) {
    throw new Error("Attestation object authData is not a byte string");
  }

  return Buffer.from(authData);
}
