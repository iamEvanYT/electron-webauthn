import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";

/**
 * NSInteger and NSUInteger Type Information
 *
 * In Objective-C:
 * - NSInteger is a platform-dependent signed integer type
 *   - On 64-bit systems: typedef long NSInteger (64-bit signed)
 *   - On 32-bit systems: typedef int NSInteger (32-bit signed)
 * - NSUInteger is the unsigned equivalent
 *   - On 64-bit systems: typedef unsigned long NSUInteger (64-bit unsigned)
 *   - On 32-bit systems: typedef unsigned int NSUInteger (32-bit unsigned)
 *
 * NSInteger ranges (64-bit):
 * - Min: -9,223,372,036,854,775,808 (-(2^63))
 * - Max: 9,223,372,036,854,775,807 (2^63 - 1)
 *
 * NSUInteger ranges (64-bit):
 * - Min: 0
 * - Max: 18,446,744,073,709,551,615 (2^64 - 1)
 *
 * JavaScript Number Considerations:
 * - JavaScript Number is a 64-bit floating point (IEEE 754)
 * - Safe integer range: -(2^53 - 1) to (2^53 - 1)
 * - Values outside this range may lose precision
 * - Use BigInt for values exceeding Number.MAX_SAFE_INTEGER
 */

// Constants for 64-bit NSInteger (most common on modern macOS)
export const NSIntegerMax = 9223372036854775807n; // 2^63 - 1
export const NSIntegerMin = -9223372036854775808n; // -(2^63)
export const NSUIntegerMax = 18446744073709551615n; // 2^64 - 1

// JavaScript safe integer range
export const JS_SAFE_INTEGER_MAX = Number.MAX_SAFE_INTEGER; // 2^53 - 1
export const JS_SAFE_INTEGER_MIN = Number.MIN_SAFE_INTEGER; // -(2^53 - 1)

// Class declaration
// Note: NSInteger is typically used as a primitive return type or parameter
// in Objective-C methods, not as a standalone object. This wrapper provides
// type definitions and helper functions for working with NSInteger values.
export declare class _NSNumber extends NobjcObject {
  // NSNumber methods commonly used with NSInteger values
  static numberWithInteger$(value: number): _NSNumber;
  static numberWithUnsignedInteger$(value: number): _NSNumber;
  static numberWithLong$(value: number): _NSNumber;
  static numberWithUnsignedLong$(value: number): _NSNumber;

  integerValue(): number;
  unsignedIntegerValue(): number;
  longValue(): number;
  unsignedLongValue(): number;
  intValue(): number;
  longLongValue(): number;
  unsignedLongLongValue(): number;
  doubleValue(): number;
  boolValue(): boolean;

  compare$(other: _NSNumber): number;
  isEqualToNumber$(other: _NSNumber): boolean;

  stringValue(): NobjcObject;
  descriptionWithLocale$(locale: NobjcObject | null): NobjcObject;
}
export const NSNumber = Foundation.NSNumber as unknown as typeof _NSNumber;

// Helper Functions

/**
 * Create NSNumber from a JavaScript number representing an NSInteger
 * @param value The integer value (signed)
 * @returns An NSNumber object containing the integer
 */
export function NSNumberFromInteger(value: number): _NSNumber {
  return NSNumber.numberWithInteger$(value);
}

/**
 * Create NSNumber from a JavaScript number representing an NSUInteger
 * @param value The unsigned integer value
 * @returns An NSNumber object containing the unsigned integer
 */
export function NSNumberFromUnsignedInteger(value: number): _NSNumber {
  return NSNumber.numberWithUnsignedInteger$(value);
}

/**
 * Extract an NSInteger value from an NSNumber object
 * @param number The NSNumber object
 * @returns The integer value as a JavaScript number
 */
export function integerFromNSNumber(number: NobjcObject): number {
  const nsNumber = number as unknown as typeof NSNumber.prototype;
  return nsNumber.integerValue();
}

/**
 * Extract an NSUInteger value from an NSNumber object
 * @param number The NSNumber object
 * @returns The unsigned integer value as a JavaScript number
 */
export function unsignedIntegerFromNSNumber(number: NobjcObject): number {
  const nsNumber = number as unknown as typeof NSNumber.prototype;
  return nsNumber.unsignedIntegerValue();
}

/**
 * Create NSNumber from a JavaScript BigInt representing an NSInteger
 * Useful for values outside JavaScript's safe integer range
 * @param value The integer value as BigInt
 * @returns An NSNumber object containing the integer
 */
export function NSNumberFromBigInt(value: bigint): _NSNumber {
  // For very large values, convert through string or use longValue
  if (value >= BigInt(JS_SAFE_INTEGER_MIN) && value <= BigInt(JS_SAFE_INTEGER_MAX)) {
    return NSNumber.numberWithInteger$(Number(value));
  }
  // For values outside safe range, we need to be careful
  // This is a best-effort conversion using long type
  return NSNumber.numberWithLong$(Number(value));
}

/**
 * Check if a JavaScript number is within the safe NSInteger range for 64-bit
 * @param value The number to check
 * @returns True if the value is within NSInteger range
 */
export function isValidNSInteger(value: number): boolean {
  return Number.isInteger(value) && 
         value >= Number(NSIntegerMin) && 
         value <= Number(NSIntegerMax);
}

/**
 * Check if a JavaScript number is within the safe NSUInteger range for 64-bit
 * @param value The number to check
 * @returns True if the value is within NSUInteger range
 */
export function isValidNSUInteger(value: number): boolean {
  return Number.isInteger(value) && 
         value >= 0 && 
         value <= Number(NSUIntegerMax);
}

/**
 * Check if a JavaScript number is within JavaScript's safe integer range
 * Values outside this range may lose precision when converted to NSInteger
 * @param value The number to check
 * @returns True if the value is a safe integer
 */
export function isSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value);
}

/**
 * Safely convert a JavaScript number to NSInteger with range validation
 * @param value The number to convert
 * @param defaultValue Optional default value if validation fails
 * @returns An NSNumber object, or throws if invalid and no default provided
 */
export function safeNSInteger(value: number, defaultValue?: number): _NSNumber {
  if (!isValidNSInteger(value)) {
    if (defaultValue !== undefined) {
      return NSNumber.numberWithInteger$(defaultValue);
    }
    throw new RangeError(
      `Value ${value} is out of NSInteger range [${NSIntegerMin}, ${NSIntegerMax}]`
    );
  }
  return NSNumber.numberWithInteger$(value);
}

/**
 * Safely convert a JavaScript number to NSUInteger with range validation
 * @param value The number to convert
 * @param defaultValue Optional default value if validation fails
 * @returns An NSNumber object, or throws if invalid and no default provided
 */
export function safeNSUInteger(value: number, defaultValue?: number): _NSNumber {
  if (!isValidNSUInteger(value)) {
    if (defaultValue !== undefined) {
      return NSNumber.numberWithUnsignedInteger$(defaultValue);
    }
    throw new RangeError(
      `Value ${value} is out of NSUInteger range [0, ${NSUIntegerMax}]`
    );
  }
  return NSNumber.numberWithUnsignedInteger$(value);
}

/**
 * Clamp a number to the valid NSInteger range
 * @param value The number to clamp
 * @returns The clamped value
 */
export function clampToNSInteger(value: number): number {
  const min = Number(NSIntegerMin);
  const max = Number(NSIntegerMax);
  return Math.max(min, Math.min(max, Math.floor(value)));
}

/**
 * Clamp a number to the valid NSUInteger range
 * @param value The number to clamp
 * @returns The clamped value
 */
export function clampToNSUInteger(value: number): number {
  const max = Number(NSUIntegerMax);
  return Math.max(0, Math.min(max, Math.floor(value)));
}

/**
 * Compare two NSNumber objects containing integers
 * @param num1 First NSNumber
 * @param num2 Second NSNumber
 * @returns Negative if num1 < num2, 0 if equal, positive if num1 > num2
 */
export function compareNSNumbers(num1: NobjcObject, num2: NobjcObject): number {
  const nsNum1 = num1 as unknown as typeof NSNumber.prototype;
  return nsNum1.compare$(num2 as any);
}

/**
 * Check if two NSNumber objects are equal
 * @param num1 First NSNumber
 * @param num2 Second NSNumber
 * @returns True if the numbers are equal
 */
export function NSNumbersAreEqual(num1: NobjcObject, num2: NobjcObject): boolean {
  const nsNum1 = num1 as unknown as typeof NSNumber.prototype;
  return nsNum1.isEqualToNumber$(num2 as any);
}

/**
 * Create an array of NSNumber objects from JavaScript numbers
 * @param values Array of numbers
 * @param unsigned Whether to treat values as unsigned integers
 * @returns Array of NSNumber objects
 */
export function NSNumberArrayFromNumbers(
  values: number[],
  unsigned: boolean = false
): _NSNumber[] {
  return values.map(value => 
    unsigned 
      ? NSNumber.numberWithUnsignedInteger$(value)
      : NSNumber.numberWithInteger$(value)
  );
}

/**
 * Extract JavaScript numbers from an array of NSNumber objects
 * @param numbers Array of NSNumber objects
 * @param unsigned Whether to extract as unsigned integers
 * @returns Array of JavaScript numbers
 */
export function numbersFromNSNumberArray(
  numbers: NobjcObject[],
  unsigned: boolean = false
): number[] {
  return numbers.map(num => {
    const nsNum = num as unknown as typeof NSNumber.prototype;
    return unsigned ? nsNum.unsignedIntegerValue() : nsNum.integerValue();
  });
}

/**
 * Get the string representation of an NSNumber
 * @param number The NSNumber object
 * @returns String representation
 */
export function stringFromNSNumber(number: NobjcObject): string {
  const nsNumber = number as unknown as typeof NSNumber.prototype;
  const nsString = nsNumber.stringValue();
  return (nsString as any).UTF8String();
}

/**
 * Convert NSInteger value to a formatted string with thousands separators
 * @param value The integer value
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNSInteger(value: number): string {
  return value.toLocaleString('en-US', { 
    maximumFractionDigits: 0,
    useGrouping: true 
  });
}

/**
 * Convert NSInteger value to hexadecimal string
 * @param value The integer value
 * @param prefix Whether to include '0x' prefix
 * @returns Hexadecimal string
 */
export function NSIntegerToHex(value: number, prefix: boolean = true): string {
  const hex = Math.abs(value).toString(16).toUpperCase();
  const sign = value < 0 ? '-' : '';
  return `${sign}${prefix ? '0x' : ''}${hex}`;
}

/**
 * Parse a hexadecimal string to NSInteger
 * @param hexString Hexadecimal string (with or without '0x' prefix)
 * @returns The parsed integer value
 */
export function NSIntegerFromHex(hexString: string): number {
  const cleaned = hexString.replace(/^0x/i, '');
  return parseInt(cleaned, 16);
}

/**
 * Get the absolute value of an NSInteger
 * @param value The integer value
 * @returns NSNumber with absolute value
 */
export function absNSInteger(value: number): _NSNumber {
  return NSNumber.numberWithInteger$(Math.abs(value));
}

/**
 * Calculate the minimum of two NSInteger values
 * @param a First value
 * @param b Second value
 * @returns NSNumber with minimum value
 */
export function minNSInteger(a: number, b: number): _NSNumber {
  return NSNumber.numberWithInteger$(Math.min(a, b));
}

/**
 * Calculate the maximum of two NSInteger values
 * @param a First value
 * @param b Second value
 * @returns NSNumber with maximum value
 */
export function maxNSInteger(a: number, b: number): _NSNumber {
  return NSNumber.numberWithInteger$(Math.max(a, b));
}

/**
 * Type guard to check if a value is an NSNumber object
 * @param value The value to check
 * @returns True if the value is an NSNumber
 */
export function isNSNumber(value: any): value is _NSNumber {
  try {
    return value && typeof value === 'object' && 
           typeof (value as any).integerValue === 'function';
  } catch {
    return false;
  }
}
