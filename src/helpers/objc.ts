/**
 * Returns the key name for a given numeric value in a const enum-like object.
 *
 * @param enumObj - A const object mapping string keys to numeric values.
 * @param value - The numeric value to look up.
 * @returns The matching key name, or `undefined` if not found.
 *
 * @example
 * ```ts
 * const state = enumFromValue(
 *   ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState,
 *   rawValue
 * ); // e.g. "Authorized" | "Denied" | "NotDetermined" | undefined
 * ```
 */
export function enumFromValue<T extends Record<string, number>>(
  enumObj: T,
  value: number
): keyof T | undefined {
  return (Object.keys(enumObj) as (keyof T)[]).find(
    (key) => enumObj[key] === value
  );
}

/**
 * Wraps a function that accepts a trailing callback into a Promise.
 *
 * @param args - Arguments to pass to the function before the callback.
 * @param func - A function that accepts the provided arguments followed by a
 *   completion callback, and invokes the callback with the result.
 * @returns A Promise that resolves with the value passed to the callback.
 *
 * @example
 * ```ts
 * const authState = await makePromise(
 *   manager.requestAuthorizationForPublicKeyCredentials$.bind(manager)
 * );
 *
 * const result = await makePromise(
 *   arg1, arg2,
 *   (a1, a2, callback) => someFunc(a1, a2, callback)
 * );
 * ```
 */
export function makePromise<T, Args extends unknown[]>(
  ...argsAndFunc: [
    ...args: Args,
    func: (...args: [...Args, callback: (result: T) => void]) => void,
  ]
): Promise<T> {
  const func = argsAndFunc[argsAndFunc.length - 1] as (
    ...args: [...Args, callback: (result: T) => void]
  ) => void;
  const args = argsAndFunc.slice(0, -1) as unknown as Args;
  return new Promise<T>((resolve) => {
    func(...args, resolve);
  });
}
