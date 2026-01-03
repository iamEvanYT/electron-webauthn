import type { NobjcObject } from "objc-js";

/**
 * Helper to allocate and initialize an Objective-C object with no arguments
 * @param cls The Objective-C class
 * @returns The initialized instance
 */
export function allocInitPlain(cls: NobjcObject): NobjcObject {
  const instance = (cls["alloc"] as unknown as () => NobjcObject)();
  const initializer = instance["init"] as unknown as () => NobjcObject;
  return initializer();
}
