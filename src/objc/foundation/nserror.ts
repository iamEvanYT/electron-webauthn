import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";
import { type _NSString } from "./nsstring.js";

// Class declaration
export declare class _NSError extends NobjcObject {
  // Properties
  domain(): _NSString;
  code(): number;
  userInfo(): NobjcObject; // NSDictionary
  localizedDescription(): _NSString;
  localizedFailureReason(): _NSString;
  localizedRecoverySuggestion(): _NSString;
  localizedRecoveryOptions(): NobjcObject; // NSArray
}

export const NSError = Foundation.NSError as unknown as typeof _NSError;

/**
 * Parse an NSError object into a JavaScript-friendly format
 * @param error The NSError object
 * @returns An object containing the error details
 */
export function parseNSError(error: NobjcObject): {
  domain: string;
  code: number;
  localizedDescription: string;
  localizedFailureReason?: string;
  localizedRecoverySuggestion?: string;
  userInfo?: Record<string, any>;
} {
  const nsError = error as unknown as typeof NSError.prototype;

  const domain = nsError.domain().UTF8String();
  const code = nsError.code();
  const localizedDescription = nsError.localizedDescription().UTF8String();

  // Optional properties that may be null
  let localizedFailureReason: string | undefined;
  try {
    const reason = nsError.localizedFailureReason();
    if (reason) {
      localizedFailureReason = reason.UTF8String();
    }
  } catch (e) {
    // Property may not exist or be null
  }

  let localizedRecoverySuggestion: string | undefined;
  try {
    const suggestion = nsError.localizedRecoverySuggestion();
    if (suggestion) {
      localizedRecoverySuggestion = suggestion.UTF8String();
    }
  } catch (e) {
    // Property may not exist or be null
  }

  // userInfo is a dictionary - basic parsing
  let userInfo: Record<string, any> | undefined;
  try {
    const userInfoDict = nsError.userInfo();
    if (userInfoDict) {
      // For now, just get the description
      // Full dictionary parsing would require NSDictionary wrapper
      userInfo = {
        description: (userInfoDict as any).description().UTF8String(),
      };
    }
  } catch (e) {
    // userInfo may not be accessible
  }

  return {
    domain,
    code,
    localizedDescription,
    ...(localizedFailureReason && { localizedFailureReason }),
    ...(localizedRecoverySuggestion && { localizedRecoverySuggestion }),
    ...(userInfo && { userInfo }),
  };
}

/**
 * Convert an NSError to a JavaScript Error object
 * @param error The NSError object
 * @returns A JavaScript Error with NSError details
 */
export function nsErrorToJSError(error: NobjcObject): Error {
  const parsed = parseNSError(error);
  const jsError = new Error(parsed.localizedDescription);
  jsError.name = `${parsed.domain} (${parsed.code})`;
  (jsError as any).nsError = parsed;
  return jsError;
}
