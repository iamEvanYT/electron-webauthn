/**
 * Creates a Promise along with its resolve and reject callbacks.
 * This is a polyfill for the native Promise.withResolvers() method.
 *
 * @template T - The type of value the promise resolves to
 * @returns An object containing the promise and its associated resolve and reject functions
 *
 * @example
 * ```ts
 * const { promise, resolve, reject } = PromiseWithResolvers<string>();
 * promise.then(value => console.log(value)); // "Hello"
 * resolve("Hello");
 * ```
 */
export function PromiseWithResolvers<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
