export function isString(value: unknown): value is string {
  return value && typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return value && typeof value === "number";
}

export function isObject(value: unknown) {
  return value && typeof value === "object";
}

const AUTHORIZATION_ERROR_DOMAIN =
  "com.apple.AuthenticationServices.AuthorizationError";

/** Minimal NSError surface used by ASAuthorizationController delegates. */
interface NSErrorLike {
  localizedDescription(): { UTF8String(): string };
  code(): number;
  domain(): { UTF8String(): string };
}

/**
 * JS Error carrying NSError code/domain. Those fields are not localized, so
 * callers can map AuthorizationError without matching English message text.
 */
export class NativeError extends Error {
  readonly code?: number;
  readonly domain?: string;

  constructor(
    message: string,
    options?: {
      code?: number;
      domain?: string;
    }
  ) {
    super(message);
    this.name = "NativeError";
    this.code = options?.code;
    this.domain = options?.domain;
  }

  static fromNSError(error: NSErrorLike): NativeError {
    const message = error.localizedDescription().UTF8String();
    try {
      return new NativeError(message, {
        code: error.code(),
        domain: error.domain().UTF8String(),
      });
    } catch {
      return new NativeError(message);
    }
  }
}

export function mapNativeAuthorizationError(
  error: unknown
): "InvalidStateError" | "NotAllowedError" {
  // Prefer NSError code/domain from authorizationController delegates (never localized).
  if (
    error instanceof NativeError &&
    error.domain === AUTHORIZATION_ERROR_DOMAIN &&
    typeof error.code === "number"
  ) {
    return error.code === 1006 ? "InvalidStateError" : "NotAllowedError";
  }

  // Fallback: domain name and numeric code survive localization in NSError descriptions.
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";
  const match = msg.match(/AuthorizationError\D{0,20}?(\d+)/);
  const code = match ? Number(match[1]) : null;
  if (code === 1006) {
    // ASAuthorizationError.matchedExcludedCredential (create excludeCredentials only).
    return "InvalidStateError";
  }
  return "NotAllowedError";
}
