import { describe, expect, test } from "bun:test";
import { extractRawAuthenticatorData } from "../packages/macos/src/helpers/attestation";

// Hand-crafted minimal CBOR-encoded attestation object:
// { "fmt": "none", "attStmt": {}, "authData": <4 raw bytes> }
function buildAttestationObject(authData: number[]): Buffer {
  return Buffer.from([
    0xa3, // map(3)
    0x63,
    0x66,
    0x6d,
    0x74, // "fmt"
    0x64,
    0x6e,
    0x6f,
    0x6e,
    0x65, // "none"
    0x67,
    0x61,
    0x74,
    0x74,
    0x53,
    0x74,
    0x6d,
    0x74, // "attStmt"
    0xa0, // {}
    0x68,
    0x61,
    0x75,
    0x74,
    0x68,
    0x44,
    0x61,
    0x74,
    0x61, // "authData"
    0x40 + authData.length, // byte string(len)
    ...authData,
  ]);
}

describe("extractRawAuthenticatorData", () => {
  test("extracts the exact authData bytes from a CBOR attestation object", () => {
    const attestationObject = buildAttestationObject([0xde, 0xad, 0xbe, 0xef]);

    const result = extractRawAuthenticatorData(attestationObject);

    expect(result).toEqual(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
  });

  test("throws on a non-map top-level CBOR value", () => {
    // A bare CBOR text string "hello" instead of a map.
    const notAMap = Buffer.from([0x65, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);

    expect(() => extractRawAuthenticatorData(notAMap)).toThrow();
  });

  test("throws when authData is missing", () => {
    const attestationObject = Buffer.from([
      0xa1, // map(1)
      0x63,
      0x66,
      0x6d,
      0x74, // "fmt"
      0x64,
      0x6e,
      0x6f,
      0x6e,
      0x65, // "none"
    ]);

    expect(() => extractRawAuthenticatorData(attestationObject)).toThrow();
  });
});
