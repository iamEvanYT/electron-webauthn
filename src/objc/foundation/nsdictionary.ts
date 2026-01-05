import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
export declare class _NSDictionary extends NobjcObject {
  // Creation methods
  static dictionaryWithObject$forKey$(
    object: NobjcObject,
    key: NobjcObject
  ): _NSDictionary;
  static dictionaryWithObjects$forKeys$(
    objects: NobjcObject[],
    keys: NobjcObject[]
  ): _NSDictionary;
  static dictionaryWithObjects$forKeys$count$(
    objects: NobjcObject[],
    keys: NobjcObject[],
    count: number
  ): _NSDictionary;
  static dictionaryWithDictionary$(dict: _NSDictionary): _NSDictionary;
  static dictionary(): _NSDictionary;

  // Instance methods
  count(): number;
  objectForKey$(key: NobjcObject): NobjcObject | null;
  allKeys(): NobjcObject;
  allValues(): NobjcObject;
  isEqualToDictionary$(other: _NSDictionary): boolean;
  keyEnumerator(): NobjcObject;
  objectEnumerator(): NobjcObject;

  // File operations
  writeToFile$atomically$(path: NobjcObject, atomically: boolean): boolean;
  writeToURL$atomically$(url: NobjcObject, atomically: boolean): boolean;
  static dictionaryWithContentsOfFile$(path: NobjcObject): _NSDictionary | null;
  static dictionaryWithContentsOfURL$(url: NobjcObject): _NSDictionary | null;

  // String representation
  description(): NobjcObject;
}
export const NSDictionary =
  Foundation.NSDictionary as unknown as typeof _NSDictionary;

// Helper Functions

/**
 * Create a new empty NSDictionary
 * @returns An empty NSDictionary object
 */
export function NSDictionaryCreate(): _NSDictionary {
  return NSDictionary.dictionary();
}

/**
 * Create an NSDictionary with a single key-value pair
 * @param key The key object
 * @param value The value object
 * @returns An NSDictionary containing the key-value pair
 */
export function NSDictionaryFromKeyValue(
  key: NobjcObject,
  value: NobjcObject
): _NSDictionary {
  return NSDictionary.dictionaryWithObject$forKey$(value, key);
}

/**
 * Create an NSDictionary from arrays of keys and values
 * @param keys Array of key objects
 * @param values Array of value objects
 * @returns An NSDictionary containing the key-value pairs
 */
export function NSDictionaryFromKeysAndValues(
  keys: NobjcObject[],
  values: NobjcObject[]
): _NSDictionary {
  if (keys.length !== values.length) {
    throw new Error("Keys and values arrays must have the same length");
  }
  return NSDictionary.dictionaryWithObjects$forKeys$(values, keys);
}

/**
 * Create an NSDictionary from another NSDictionary
 * @param dict The source dictionary
 * @returns A new NSDictionary with copied entries
 */
export function NSDictionaryCopy(dict: NobjcObject): _NSDictionary {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return NSDictionary.dictionaryWithDictionary$(nsDictionary);
}

/**
 * Get a value from an NSDictionary by key
 * @param dict The NSDictionary object
 * @param key The key to look up
 * @returns The value associated with the key, or null if not found
 */
export function NSDictionaryGetValue(
  dict: NobjcObject,
  key: NobjcObject
): NobjcObject | null {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.objectForKey$(key);
}

/**
 * Get the number of entries in an NSDictionary
 * @param dict The NSDictionary object
 * @returns The count of key-value pairs
 */
export function NSDictionaryCount(dict: NobjcObject): number {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.count();
}

/**
 * Get all keys from an NSDictionary
 * @param dict The NSDictionary object
 * @returns An NSArray containing all keys
 */
export function NSDictionaryAllKeys(dict: NobjcObject): NobjcObject {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.allKeys();
}

/**
 * Get all values from an NSDictionary
 * @param dict The NSDictionary object
 * @returns An NSArray containing all values
 */
export function NSDictionaryAllValues(dict: NobjcObject): NobjcObject {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.allValues();
}

/**
 * Compare two NSDictionaries for equality
 * @param dict1 The first NSDictionary
 * @param dict2 The second NSDictionary
 * @returns True if the dictionaries have equal key-value pairs
 */
export function NSDictionaryIsEqual(
  dict1: NobjcObject,
  dict2: NobjcObject
): boolean {
  const nsDictionary1 = dict1 as unknown as typeof NSDictionary.prototype;
  return nsDictionary1.isEqualToDictionary$(dict2 as any);
}

/**
 * Get an enumerator for keys in an NSDictionary
 * @param dict The NSDictionary object
 * @returns An NSEnumerator for the keys
 */
export function NSDictionaryKeyEnumerator(dict: NobjcObject): NobjcObject {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.keyEnumerator();
}

/**
 * Get an enumerator for values in an NSDictionary
 * @param dict The NSDictionary object
 * @returns An NSEnumerator for the values
 */
export function NSDictionaryObjectEnumerator(dict: NobjcObject): NobjcObject {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.objectEnumerator();
}

/**
 * Write an NSDictionary to a file
 * @param dict The NSDictionary object
 * @param path The file path (as NSString)
 * @param atomically Whether to write atomically
 * @returns True if the write succeeded
 */
export function NSDictionaryWriteToFile(
  dict: NobjcObject,
  path: NobjcObject,
  atomically: boolean
): boolean {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.writeToFile$atomically$(path, atomically);
}

/**
 * Write an NSDictionary to a URL
 * @param dict The NSDictionary object
 * @param url The URL (as NSURL)
 * @param atomically Whether to write atomically
 * @returns True if the write succeeded
 */
export function NSDictionaryWriteToURL(
  dict: NobjcObject,
  url: NobjcObject,
  atomically: boolean
): boolean {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.writeToURL$atomically$(url, atomically);
}

/**
 * Load an NSDictionary from a file
 * @param path The file path (as NSString)
 * @returns An NSDictionary loaded from the file, or null if load failed
 */
export function NSDictionaryFromFile(path: NobjcObject): _NSDictionary | null {
  return NSDictionary.dictionaryWithContentsOfFile$(path);
}

/**
 * Load an NSDictionary from a URL
 * @param url The URL (as NSURL)
 * @returns An NSDictionary loaded from the URL, or null if load failed
 */
export function NSDictionaryFromURL(url: NobjcObject): _NSDictionary | null {
  return NSDictionary.dictionaryWithContentsOfURL$(url);
}

/**
 * Get the string representation of an NSDictionary
 * @param dict The NSDictionary object
 * @returns An NSString representing the dictionary
 */
export function NSDictionaryDescription(dict: NobjcObject): NobjcObject {
  const nsDictionary = dict as unknown as typeof NSDictionary.prototype;
  return nsDictionary.description();
}
