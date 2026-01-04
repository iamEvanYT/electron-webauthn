import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _NSArray extends NobjcObject {
  static arrayWithObject$(object: NobjcObject): _NSArray;
  static arrayWithArray$(array: _NSArray): _NSArray;
  static array(): _NSArray;
  count(): number;
  objectAtIndex$(index: number): NobjcObject;
  arrayByAddingObject$(object: NobjcObject): _NSArray;
}
export const NSArray = Foundation.NSArray as unknown as typeof _NSArray;

// Helper Functions

/**
 * Create an NSArray from an array of objects
 * @param objects The array of objects
 * @returns An NSArray object
 */
export function NSArrayFromObjects(objects: NobjcObject[]): _NSArray {
  if (objects.length === 0) {
    return NSArray.array();
  }
  let array = NSArray.arrayWithObject$(objects[0]);
  for (let i = 1; i < objects.length; i++) {
    array = array.arrayByAddingObject$(objects[i]);
  }
  return array;
}
