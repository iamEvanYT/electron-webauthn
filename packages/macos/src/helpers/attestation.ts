import {
  CBORByteString,
  CBORMap,
  CBORTextString,
  decodeCBORNoLeftoverBytes,
} from "@oslojs/cbor";

/**
 * Extract the raw `authData` bytes from a CBOR-encoded attestation object.
 *
 * `@oslojs/webauthn`'s `parseAttestationObject` only exposes the *parsed*
 * authenticator data fields (no raw byte access), but the WebAuthn spec
 * requires returning the original authData bytes to the caller (they are
 * fed back into signature/hash verification on the relying party server).
 *
 * Note: we can't use `CBORMap.get()` here - `@oslojs/cbor` compares
 * `CBORTextString` keys by reference (`===` on the underlying Uint8Array),
 * so a freshly-constructed lookup key never matches a decoded one.
 */
export function extractRawAuthenticatorData(
  attestationObjectBuffer: Buffer
): Buffer {
  const decoded = decodeCBORNoLeftoverBytes(
    new Uint8Array(attestationObjectBuffer),
    16
  );
  if (!(decoded instanceof CBORMap)) {
    throw new Error(
      "Invalid attestation object: expected a top-level CBOR map"
    );
  }

  for (const [key, value] of decoded.entries) {
    if (key instanceof CBORTextString && key.decodeText() === "authData") {
      if (!(value instanceof CBORByteString)) {
        throw new Error(
          "Invalid attestation object: 'authData' is not a byte string"
        );
      }
      return Buffer.from(value.value);
    }
  }

  throw new Error("Invalid attestation object: missing 'authData' field");
}
