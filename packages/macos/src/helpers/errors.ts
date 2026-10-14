import type { _NSError } from "objcjs-types/Foundation";

const AUTHORIZATION_ERROR_DOMAIN =
  "com.apple.AuthenticationServices.AuthorizationError";

// ASAuthorizationErrorMatchedExcludedCredential
const MATCHED_EXCLUDED_CREDENTIAL_CODE = 1006;

export interface NativeAuthorizationError extends Error {
  code?: number;
  domain?: string;
}

/**
 * Wraps an NSError in an Error that keeps the (non-localized) code and domain,
 * since `localizedDescription` changes with the system language.
 */
export function createNativeAuthorizationError(
  error: _NSError
): NativeAuthorizationError {
  const result: NativeAuthorizationError = new Error(
    error.localizedDescription().UTF8String()
  );
  result.code = Number(error.code());
  result.domain = error.domain().UTF8String();
  return result;
}

export function isMatchedExcludedCredentialError(error: Error): boolean {
  const { code, domain } = error as NativeAuthorizationError;
  if (code !== undefined && domain !== undefined) {
    return (
      domain === AUTHORIZATION_ERROR_DOMAIN &&
      code === MATCHED_EXCLUDED_CREDENTIAL_CODE
    );
  }
  return error.message.includes(
    `(${AUTHORIZATION_ERROR_DOMAIN} error ${MATCHED_EXCLUDED_CREDENTIAL_CODE}.)`
  );
}

export function mapCreateAuthorizationError(
  error: Error
): "InvalidStateError" | "NotAllowedError" {
  return isMatchedExcludedCredentialError(error)
    ? "InvalidStateError"
    : "NotAllowedError";
}
