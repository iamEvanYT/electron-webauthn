import { describe, expect, test } from "bun:test";
import { extractRawAuthenticatorData } from "../packages/macos/src/helpers/attestation";

// CBOR for { "fmt": "none", "attStmt": {}, "authData": h'0102030405' }
const ATTESTATION_OBJECT = Buffer.from(
  "a363666d74646e6f6e656761747453746d74a068617574684461746145" + "0102030405",
  "hex"
);

describe("extractRawAuthenticatorData", () => {
  test("returns the raw authData bytes from an attestation object", () => {
    expect(extractRawAuthenticatorData(ATTESTATION_OBJECT)).toEqual(
      Buffer.from([1, 2, 3, 4, 5])
    );
  });

  test("throws when authData is missing", () => {
    // { "fmt": "none" }
    const missing = Buffer.from("a163666d74646e6f6e65", "hex");
    expect(() => extractRawAuthenticatorData(missing)).toThrow();
  });
});
