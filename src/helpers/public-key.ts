/**
 * Encode a bigint to a Buffer with the specified byte length.
 * The bigint is encoded as a big-endian unsigned integer.
 */
function encodeBigIntToBuffer(value: bigint, byteLength: number): Buffer {
  const hex = value.toString(16).padStart(byteLength * 2, "0");
  return Buffer.from(hex, "hex");
}

/**
 * Encode a COSE EC2 public key (P-256) to DER-encoded SubjectPublicKeyInfo (SPKI) format.
 *
 * @param x - The x-coordinate as a bigint
 * @param y - The y-coordinate as a bigint
 * @returns A Buffer containing the DER-encoded SPKI
 *
 * The SPKI structure for P-256 is:
 * SEQUENCE {
 *   SEQUENCE {
 *     OBJECT IDENTIFIER ecPublicKey (1.2.840.10045.2.1)
 *     OBJECT IDENTIFIER prime256v1 (1.2.840.10045.3.1.7)
 *   }
 *   BIT STRING (uncompressed point: 0x04 || x || y)
 * }
 */
export function encodeEC2PublicKeyToSPKI(x: bigint, y: bigint): Buffer {
  // Convert coordinates to 32-byte buffers (P-256 uses 32-byte coordinates)
  const xBuffer = encodeBigIntToBuffer(x, 32);
  const yBuffer = encodeBigIntToBuffer(y, 32);

  // Uncompressed point format: 0x04 || x || y
  const uncompressedPoint = Buffer.concat([
    Buffer.from([0x04]),
    xBuffer,
    yBuffer,
  ]);

  // DER encode the BIT STRING
  // BIT STRING tag (0x03), length, unused bits (0x00), then the data
  const bitString = Buffer.concat([
    Buffer.from([0x03]), // BIT STRING tag
    Buffer.from([0x42]), // Length: 66 bytes (1 unused bits byte + 65 point bytes)
    Buffer.from([0x00]), // No unused bits
    uncompressedPoint,
  ]);

  // Algorithm identifier for ECDSA with P-256
  // SEQUENCE { OID ecPublicKey, OID prime256v1 }
  const algorithmIdentifier = Buffer.from([
    0x30,
    0x13, // SEQUENCE, length 19
    0x06,
    0x07, // OID, length 7
    0x2a,
    0x86,
    0x48,
    0xce,
    0x3d,
    0x02,
    0x01, // ecPublicKey (1.2.840.10045.2.1)
    0x06,
    0x08, // OID, length 8
    0x2a,
    0x86,
    0x48,
    0xce,
    0x3d,
    0x03,
    0x01,
    0x07, // prime256v1 (1.2.840.10045.3.1.7)
  ]);

  // Wrap everything in a SEQUENCE
  const spki = Buffer.concat([
    Buffer.from([0x30]), // SEQUENCE tag
    Buffer.from([0x59]), // Length: 89 bytes (19 + 70)
    algorithmIdentifier,
    bitString,
  ]);

  return spki;
}
