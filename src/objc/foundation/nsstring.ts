import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
export declare class _NSString extends NobjcObject {
  static stringWithUTF8String$(str: string): _NSString;
  UTF8String(): string;
  length(): number;
  toString(): string;
}
export const NSString = Foundation.NSString as unknown as typeof _NSString;

// Helper Functions

/**
 * Create NSString from a JavaScript string
 * @param str The string object
 * @returns An NSString object
 */
export function NSStringFromString(str: string): _NSString {
  return NSString.stringWithUTF8String$(str);
}
