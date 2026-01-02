import { NobjcObject, NobjcProtocol } from "objc-js";

/**
 * ASAuthorizationControllerDelegate Protocol
 *
 * A protocol that provides methods for handling authorization flow events.
 * https://developer.apple.com/documentation/authenticationservices/asauthorizationcontrollerdelegate
 *
 * Protocol Methods:
 * - authorizationController:didCompleteWithAuthorization: - Called when authorization succeeds
 * - authorizationController:didCompleteWithError: - Called when authorization fails
 */

export interface ASAuthorizationControllerDelegateCallbacks {
  /**
   * Tells the delegate that authorization completed successfully.
   * @param controller The authorization controller that completed.
   * @param authorization The authorization object containing the credential.
   */
  didCompleteWithAuthorization?: (
    controller: NobjcObject,
    authorization: NobjcObject
  ) => void;

  /**
   * Tells the delegate that authorization failed with an error.
   * @param controller The authorization controller that failed.
   * @param error The error that occurred during authorization.
   */
  didCompleteWithError?: (controller: NobjcObject, error: NobjcObject) => void;
}

/**
 * Create an ASAuthorizationControllerDelegate instance
 *
 * This creates an Objective-C object that implements the ASAuthorizationControllerDelegate
 * protocol using the objc-js protocol implementation API.
 *
 * @param callbacks Object containing callback functions for delegate methods
 * @returns A NobjcObject that can be set as the delegate of an ASAuthorizationController
 *
 * @example
 * ```typescript
 * const delegate = createAuthorizationControllerDelegate({
 *   didCompleteWithAuthorization: (controller, authorization) => {
 *     console.log("Authorization succeeded!");
 *     const credential = authorization.credential();
 *     // Process the credential
 *   },
 *   didCompleteWithError: (controller, error) => {
 *     console.error("Authorization failed:", error.localizedDescription());
 *   }
 * });
 *
 * authController.setDelegate$(delegate);
 * authController.performRequests();
 * ```
 */
export function createAuthorizationControllerDelegate(
  callbacks: ASAuthorizationControllerDelegateCallbacks
): NobjcObject {
  const methodImplementations: Record<string, (...args: any[]) => any> = {};

  // Map the callbacks to Objective-C method names using $ notation
  if (callbacks.didCompleteWithAuthorization) {
    methodImplementations[
      "authorizationController$didCompleteWithAuthorization$"
    ] = callbacks.didCompleteWithAuthorization;
  }

  if (callbacks.didCompleteWithError) {
    methodImplementations["authorizationController$didCompleteWithError$"] =
      callbacks.didCompleteWithError;
  }

  // Create and return the protocol implementation
  return NobjcProtocol.implement(
    "ASAuthorizationControllerDelegate",
    methodImplementations
  );
}
