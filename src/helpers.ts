import { createHash } from "crypto";

/**
 * Creates a Promise along with its resolve and reject callbacks.
 * This is a polyfill for the native Promise.withResolvers() method.
 *
 * @template T - The type of value the promise resolves to
 * @returns An object containing the promise and its associated resolve and reject functions
 *
 * @example
 * ```ts
 * const { promise, resolve, reject } = PromiseWithResolvers<string>();
 * promise.then(value => console.log(value)); // "Hello"
 * resolve("Hello");
 * ```
 */
export function PromiseWithResolvers<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

/**
 * WebAuthn: clientDataHash = SHA-256(clientDataJSON_bytes)
 *
 * - Input must be the exact bytes of CollectedClientData JSON (UTF-8).
 * - Output is 32-byte SHA-256 digest.
 */
export function clientDataJsonBufferToHash(clientDataJSON: Buffer): Buffer {
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
 * Serializes an origin according to the HTML specification.
 * Based on https://html.spec.whatwg.org/multipage/browsers.html#ascii-serialisation-of-an-origin
 *
 * @param origin - The origin string to serialize (e.g., "https://example.com:8080")
 * @returns The serialized origin string, or "null" for opaque origins
 *
 * @example
 * ```ts
 * serializeOrigin("https://example.com:443"); // "https://example.com:443"
 * serializeOrigin("http://localhost:8080");   // "http://localhost:8080"
 * serializeOrigin("null");                    // "null"
 * ```
 */
export function serializeOrigin(origin: string): string | null {
  // If origin is an opaque origin (represented as "null"), return "null"
  if (origin === "null" || !origin) {
    return null;
  }

  try {
    // Parse the origin using URL constructor
    const url = new URL(origin);

    // Build the serialized origin
    let result = url.protocol; // Already includes "://"

    // If protocol doesn't end with "://", ensure it's added
    if (!result.endsWith("://")) {
      result = result.replace(/:$/, "") + "://";
    }

    // Append the host (already serialized by URL)
    result += url.hostname;

    // If port is non-null and non-default, append it
    if (url.port) {
      result += ":" + url.port;
    }

    return result;
  } catch (error) {
    // If URL parsing fails, treat as opaque origin
    return null;
  }
}

/**
 * Convert an ArrayBuffer to a base64url string.
 */
export function bufferToBase64Url(buffer: Buffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
