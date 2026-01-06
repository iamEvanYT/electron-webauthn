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

// Base64URL (RFC 4648) -> Uint8Array
export function base64UrlToBuffer(b64url: string): Buffer {
  if (typeof b64url !== "string")
    throw new TypeError("base64Url must be a string");

  // base64url -> base64
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");

  // add padding if missing
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad !== 0) throw new Error("Invalid base64url length");

  // decode
  return Buffer.from(b64, "base64");
}
