import { createHash } from "crypto";
import { isSameOrigin, serializeOrigin } from "./origin.js";
import { bufferToBase64Url } from "./index.js";

interface WebauthnClientData {
  type: "webauthn.get" | "webauthn.create";
  challenge: string;
  origin: string;
  topOrigin?: string;
  crossOrigin: boolean;
}

// Generate our own client data instead of letting apple generate it
// This is because apple's client data lack the `crossOrigin` field, which is required by a lot of sites.
// Based on the Chromium implementation: https://source.chromium.org/chromium/chromium/src/+/80d4f5e183f311fb6200fd608eef6568d99dc2f0:components/webauthn/core/browser/client_data_json.cc;l=79
export function generateWebauthnClientData(
  origin: string,
  challenge: Buffer,
  topFrameOrigin?: string
) {
  const serializedOrigin = serializeOrigin(origin);
  const clientData: WebauthnClientData = {
    type: "webauthn.get",
    challenge: bufferToBase64Url(challenge),
    origin: serializedOrigin,
    crossOrigin: false,
  };

  if (topFrameOrigin) {
    const sameOrigin = isSameOrigin(origin, topFrameOrigin);
    if (!sameOrigin) {
      const serializedTopFrameOrigin = serializeOrigin(topFrameOrigin);
      clientData.topOrigin = serializedTopFrameOrigin;
      clientData.crossOrigin = true;
    }
  }

  return clientData;
}

/**
 * WebAuthn: clientDataHash = SHA-256(clientDataJSON_bytes)
 *
 * - Input must be the exact bytes of CollectedClientData JSON (UTF-8).
 * - Output is 32-byte SHA-256 digest.
 */
function clientDataJsonBufferToHash(clientDataJSON: Buffer): Buffer {
  if (!Buffer.isBuffer(clientDataJSON)) {
    throw new TypeError(
      "clientDataJsonBufferToHash: clientDataJSON must be a Buffer"
    );
  }
  if (clientDataJSON.length === 0) {
    throw new RangeError("clientDataJsonBufferToHash: clientDataJSON is empty");
  }

  return createHash("sha256").update(clientDataJSON).digest();
}

/**
 * Generates the client data info for a WebAuthn operation.
 * @param clientData - The client data for the WebAuthn operation.
 * @returns The client data info.
 */
export function generateClientDataInfo(clientData: WebauthnClientData) {
  const clientDataJSON = JSON.stringify(clientData);
  const clientDataBuffer = Buffer.from(clientDataJSON, "utf-8");
  const clientDataHash = clientDataJsonBufferToHash(clientDataBuffer);

  return { clientDataJSON, clientDataBuffer, clientDataHash };
}
