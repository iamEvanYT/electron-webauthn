import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

/**
 * ASCPublicKeyCredentialDescriptor
 *
 * A descriptor that identifies a public key credential with transport options.
 * https://developer.apple.com/documentation/authenticationservices/ascpublickeycredentialdescriptor?language=objc
 *
 * This class is used to specify which credentials are acceptable for authentication
 * along with their supported transports. It's typically used in assertion requests
 * to indicate which credentials the relying party is willing to accept and how they
 * can be accessed.
 */
declare class _ASCPublicKeyCredentialDescriptor extends NobjcObject {
  /**
   * Creates a credential descriptor with the specified credential identifier and transports.
   *
   * @param credentialID The credential identifier as NSData
   * @param transports An NSArray of transport strings (e.g., "usb", "nfc", "ble", "internal")
   * @returns An initialized credential descriptor
   * @private Do not use this method directly. Use the helper function instead.
   */
  initWithCredentialID$transports$(
    credentialID: NobjcObject,
    transports: NobjcObject
  ): _ASCPublicKeyCredentialDescriptor;

  /**
   * The credential identifier.
   *
   * This is the unique identifier for the credential, typically obtained
   * during the registration process.
   *
   * @returns NSData containing the credential ID
   */
  credentialID(): NobjcObject;

  /**
   * The transports supported by this credential.
   *
   * This is an array of strings indicating the transport methods that can be
   * used to communicate with the authenticator (e.g., "usb", "nfc", "ble", "internal").
   *
   * @returns NSArray containing transport strings
   */
  transports(): NobjcObject;
}

export const ASCPublicKeyCredentialDescriptor =
  AuthenticationServices.ASCPublicKeyCredentialDescriptor as unknown as typeof _ASCPublicKeyCredentialDescriptor;

export type { _ASCPublicKeyCredentialDescriptor };

// Helper Functions

/**
 * Create an ASCPublicKeyCredentialDescriptor instance
 * @param credentialID The credential identifier (NSData)
 * @param transports An NSArray of transport strings
 * @returns An initialized credential descriptor
 */
export function createASCPublicKeyCredentialDescriptor(
  credentialID: NobjcObject,
  transports: NobjcObject
): _ASCPublicKeyCredentialDescriptor {
  const instance = (ASCPublicKeyCredentialDescriptor as any).alloc();
  return instance.initWithCredentialID$transports$(credentialID, transports);
}
