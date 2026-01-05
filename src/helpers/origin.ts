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
