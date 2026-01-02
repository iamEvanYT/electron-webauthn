import { Foundation } from "./index.js";
import { NSString, type _NSString } from "./nsstring.js";
import type { NobjcObject } from "objc-js";

/**
 * NSData to Buffer Conversion Methods
 * Recommended method: bufferFromNSDataDirect
 *
 * Two methods are provided for converting NSData to JavaScript Buffers:
 *
 * 1. bufferFromNSData (base64): Uses base64 as an intermediate format.
 *    - Most reliable and compatible
 *    - Recommended for general use
 *    - Slight overhead due to base64 encoding/decoding
 *
 * 2. bufferFromNSDataDirect (direct): Uses getBytes:length: for direct memory copy.
 *    - More efficient for large data
 *    - Direct memory access
 */

// Class declaration
export declare class _NSData extends NobjcObject {
  // Creation methods
  static dataWithBytes$length$(bytes: Buffer, length: number): _NSData;
  static dataWithData$(data: _NSData): _NSData;
  static data(): _NSData;

  // Instance properties
  length(): number;
  bytes(): any; // Returns a pointer (const void *)

  // Comparison
  isEqualToData$(other: _NSData): boolean;

  // Subdata
  subdataWithRange$(range: { location: number; length: number }): _NSData;

  // Base64 encoding/decoding
  base64EncodedStringWithOptions$(options: number): _NSString;

  // Instance method for creating from base64 (use alloc/init pattern)
  initWithBase64EncodedString$options$(
    base64String: _NSString,
    options: number
  ): _NSData;

  // Writing to file
  writeToFile$atomically$(path: _NSString, atomically: boolean): boolean;

  // Reading from file
  static dataWithContentsOfFile$(path: _NSString): _NSData;

  // Hex string representation
  description(): _NSString;

  // Get bytes in range (useful for extraction)
  getBytes$length$(buffer: Buffer, length: number): void;
  getBytes$range$(
    buffer: Buffer,
    range: { location: number; length: number }
  ): void;
}
export const NSData = Foundation.NSData as unknown as typeof _NSData;

// Helper Functions

/**
 * Create NSData from a JavaScript Buffer
 * @param buffer The Buffer object
 * @returns An NSData object
 */
export function NSDataFromBuffer(buffer: Buffer): NobjcObject {
  return NSData.dataWithBytes$length$(buffer, buffer.length);
}

/**
 * Convert NSData to a JavaScript Buffer using base64 encoding
 * This is the most reliable method for data conversion.
 * @param data The NSData object
 * @returns A Buffer containing the data
 */
export function bufferFromNSData(data: NobjcObject): Buffer {
  const nsData = data as unknown as typeof NSData.prototype;
  const length = nsData.length();

  if (length === 0) {
    return Buffer.alloc(0);
  }

  // Use base64 encoding as a reliable bridge between NSData and JS Buffer
  const base64String = nsData.base64EncodedStringWithOptions$(0);
  const base64Str = base64String.UTF8String();
  return Buffer.from(base64Str, "base64");
}

/**
 * Convert NSData to a JavaScript Buffer using direct memory copy
 * This method uses getBytes:length: for direct memory access.
 * May be more efficient for large data, but requires proper buffer allocation.
 * @param data The NSData object
 * @returns A Buffer containing the data
 */
export function bufferFromNSDataDirect(data: NobjcObject): Buffer {
  const nsData = data as unknown as typeof NSData.prototype;
  const length = nsData.length();

  if (length === 0) {
    return Buffer.alloc(0);
  }

  // Allocate a buffer and copy bytes directly
  const buffer = Buffer.alloc(length);
  nsData.getBytes$length$(buffer, length);
  return buffer;
}

/**
 * Convert NSData to a JavaScript Uint8Array
 * @param data The NSData object
 * @returns A Uint8Array containing the data
 */
export function uint8ArrayFromNSData(data: NobjcObject): Uint8Array {
  const buffer = bufferFromNSData(data);
  return new Uint8Array(buffer);
}

/**
 * Convert NSData to a base64 string
 * @param data The NSData object
 * @returns A base64-encoded string
 */
export function base64FromNSData(data: NobjcObject): string {
  const nsData = data as unknown as typeof NSData.prototype;
  const nsString = nsData.base64EncodedStringWithOptions$(0);
  return nsString.UTF8String();
}

/**
 * Create NSData from a base64 string
 * @param base64String The base64-encoded string
 * @returns An NSData object
 */
export function NSDataFromBase64(base64String: string): NobjcObject {
  const nsString = NSString.stringWithUTF8String$(base64String);
  const nsData = (NSData as any).alloc();
  return nsData.initWithBase64EncodedString$options$(nsString, 0);
}

/**
 * Get the length of NSData
 * @param data The NSData object
 * @returns The length in bytes
 */
export function NSDataLength(data: NobjcObject): number {
  const nsData = data as unknown as typeof NSData.prototype;
  return nsData.length();
}

/**
 * Create a copy of NSData
 * @param data The NSData object
 * @returns A new NSData object with copied data
 */
export function NSDataCopy(data: NobjcObject): NobjcObject {
  return NSData.dataWithData$(data as any);
}

/**
 * Compare two NSData objects for equality
 * @param data1 The first NSData object
 * @param data2 The second NSData object
 * @returns True if the data is equal
 */
export function NSDataIsEqual(data1: NobjcObject, data2: NobjcObject): boolean {
  const nsData1 = data1 as unknown as typeof NSData.prototype;
  return nsData1.isEqualToData$(data2 as any);
}

/**
 * Extract a subrange of NSData
 * Note: This method may not work with all versions of nobjc due to NSRange struct limitations.
 * As an alternative, convert to Buffer, slice, and convert back.
 * @param data The NSData object
 * @param location The starting position
 * @param length The number of bytes to extract
 * @returns A new NSData object containing the subdata
 */
export function NSDataSubdata(
  data: NobjcObject,
  location: number,
  length: number
): NobjcObject {
  // Workaround: Convert to buffer, slice, and convert back
  // This avoids the NSRange struct issue with nobjc
  const buffer = bufferFromNSData(data);
  const slicedBuffer = buffer.subarray(location, location + length);
  return NSDataFromBuffer(slicedBuffer);
}
