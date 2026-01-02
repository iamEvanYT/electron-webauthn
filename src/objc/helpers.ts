import type { NobjcObject } from "objc-js";

export class NobjcInstanceWrapper {
  private _instance: NobjcObject;

  constructor(instance: NobjcObject) {
    this._instance = instance;
  }

  get instance(): NobjcObject {
    return this._instance;
  }
}

/**
 * Helper to allocate and initialize an Objective-C object with a single argument initializer
 * @param cls The Objective-C class
 * @param initMethod The initializer method name (e.g., "initWithRelyingPartyIdentifier:")
 * @param arg The argument to pass to the initializer
 * @returns The initialized instance
 */
export function allocInit(
  cls: NobjcObject,
  initMethod: string,
  arg: NobjcObject
): NobjcObject {
  const instance = (cls["alloc"] as unknown as () => NobjcObject)();
  const initializer = instance[initMethod] as unknown as (
    arg: NobjcObject
  ) => NobjcObject;
  return initializer(arg);
}

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
