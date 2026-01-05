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

type TupleOrigin = {
  type: "tuple";
  scheme: string; // e.g. "https"
  host: string; // hostname, already normalized/punycode by URL
  port: number | null; // null means default port for scheme (or no port)
};

type OpaqueOrigin = {
  type: "opaque";
  // optional debugging info
  reason?: string;
};

type Origin = TupleOrigin | OpaqueOrigin;

export type OriginCompareOptions = {
  /**
   * If true, treat two opaque origins as same-origin when their serialized origin strings
   * are literally equal (e.g. both "null").
   *
   * ⚠️ Not spec-faithful and usually unsafe for allowlists. Default: false.
   */
  allowOpaqueStringEquality?: boolean;
};

const DEFAULT_PORT: Record<string, number> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
};

const TUPLE_SCHEMES = new Set(["http", "https", "ws", "wss", "ftp"]);

/**
 * Compute an "Origin" from either:
 * - a full URL (https://example.com/a)
 * - an origin string (https://example.com)
 * - the string "null" (opaque)
 *
 * Mirrors the URL Standard / HTML intent:
 * - tuple origin for certain schemes
 * - opaque origin otherwise
 * - blob: inherits the origin of its embedded URL when parseable
 */
export function computeOrigin(input: string | URL): Origin {
  // If caller passes serialized origin "null"
  if (typeof input === "string" && input.trim().toLowerCase() === "null") {
    return { type: "opaque", reason: "explicit 'null' origin string" };
  }

  const url = toURL(input);
  if (!url) return { type: "opaque", reason: "unparseable URL/origin string" };

  const scheme = url.protocol.replace(/:$/, "").toLowerCase();

  // blob: URL’s origin is the origin of the URL it embeds (when parseable)
  if (scheme === "blob") {
    // In practice, blob URL looks like: blob:https://example.com/uuid
    // For WHATWG URL, the "pathname" is often the embedded URL + path.
    // We try to parse the substring after "blob:" using url.href.
    const embedded = url.href.slice("blob:".length);
    const embeddedUrl = toURL(embedded);
    return embeddedUrl
      ? computeOrigin(embeddedUrl)
      : { type: "opaque", reason: "blob: with unparseable embedded URL" };
  }

  // file:, data:, about:, custom schemes, etc. -> opaque for origin purposes
  if (!TUPLE_SCHEMES.has(scheme)) {
    return { type: "opaque", reason: `non-tuple scheme '${scheme}'` };
  }

  // URL normalizes hostname to lowercase and punycode as needed.
  const host = url.hostname;
  if (!host) return { type: "opaque", reason: "missing hostname" };

  // URL.port is "" when default or absent; but we’ll normalize anyway.
  const rawPort = url.port ? safeParsePort(url.port) : null;
  const port = normalizePort(scheme, rawPort);

  return { type: "tuple", scheme, host, port };
}

function normalizePort(scheme: string, port: number | null): number | null {
  if (port == null) return null;

  const def = DEFAULT_PORT[scheme];
  // If scheme has a known default and port equals it, treat as null (default)
  if (def != null && port === def) return null;

  return port;
}

function safeParsePort(portStr: string): number | null {
  const n = Number(portStr);
  if (!Number.isInteger(n) || n < 0 || n > 65535) return null;
  return n;
}

function toURL(input: string | URL): URL | null {
  if (input instanceof URL) return input;
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

/**
 * Spec-like "same origin" comparison:
 * - tuple vs tuple: scheme+host+port match
 * - anything involving opaque: false (unless you explicitly opt into unsafe string equality)
 */
export function isSameOrigin(
  a: string | URL,
  b: string | URL,
  opts: OriginCompareOptions = {}
): boolean {
  const oa = computeOrigin(a);
  const ob = computeOrigin(b);

  if (oa.type === "tuple" && ob.type === "tuple") {
    return (
      oa.scheme === ob.scheme && oa.host === ob.host && oa.port === ob.port
    );
  }

  // Opaque origins: spec-wise, equality is about *the same opaque origin object*,
  // which you generally cannot reconstruct from strings. Safer default: always false.
  if (opts.allowOpaqueStringEquality) {
    const sa = originString(a);
    const sb = originString(b);
    return sa != null && sb != null && sa === sb;
  }

  return false;
}

export function isCrossOrigin(
  a: string | URL,
  b: string | URL,
  opts?: OriginCompareOptions
): boolean {
  return !isSameOrigin(a, b, opts);
}

function originString(x: string | URL): string | null {
  // If caller provided a serializer, use it on string inputs (typical for already-computed origins).
  if (typeof x === "string") {
    return serializeOrigin(x);
  }

  const url = toURL(x);
  if (!url) {
    return null;
  }

  // If it’s a tuple origin URL, build canonical-ish origin string.
  // Note: URL.origin omits default ports; that matches HTML origin serialization intent.
  // For blob:, URL.origin often already resolves to the embedded origin in modern runtimes,
  // but we handle blob in computeOrigin anyway.
  const o = computeOrigin(url);
  if (o.type === "opaque") return "null";

  // HTML ASCII serialization of a tuple origin:
  // scheme + "://" + host + (port is null ? "" : ":" + port)
  return `${o.scheme}://${o.host}${o.port == null ? "" : `:${o.port}`}`;
}
