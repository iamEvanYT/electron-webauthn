import { NobjcObject, NobjcProtocol } from "objc-js";

/**
 * ASAuthorizationControllerPresentationContextProviding Protocol
 *
 * A protocol that provides the window in which the authorization controller displays its interface.
 * https://developer.apple.com/documentation/authenticationservices/asauthorizationcontrollerpresentationcontextproviding
 *
 * Protocol Methods:
 * - presentationAnchorForAuthorizationController: - Returns the presentation anchor (window) for the controller
 */

export interface ASAuthorizationControllerPresentationContextProvidingCallbacks {
  /**
   * Returns the presentation anchor (window) to use when presenting the authorization interface.
   * @param controller The authorization controller requesting the presentation anchor.
   * @returns The window (ASPresentationAnchor/NSWindow) to use as the presentation anchor.
   */
  presentationAnchorForAuthorizationController: (
    controller: NobjcObject
  ) => NobjcObject;
}

/**
 * Create an ASAuthorizationControllerPresentationContextProviding instance
 *
 * This creates an Objective-C object that implements the ASAuthorizationControllerPresentationContextProviding
 * protocol using the objc-js protocol implementation API.
 *
 * @param callbacks Object containing callback functions for protocol methods
 * @returns A NobjcObject that can be set as the presentationContextProvider of an ASAuthorizationController
 *
 * @example
 * ```typescript
 * const presentationContextProvider = createPresentationContextProvider({
 *   presentationAnchorForAuthorizationController: (controller) => {
 *     // Return the NSWindow to present the authorization UI in
 *     return myNSWindow;
 *   }
 * });
 *
 * authController.setPresentationContextProvider$(presentationContextProvider);
 * authController.performRequests();
 * ```
 */
export function createPresentationContextProvider(
  callbacks: ASAuthorizationControllerPresentationContextProvidingCallbacks
): NobjcObject {
  const methodImplementations: Record<string, (...args: any[]) => any> = {};

  // Map the callback to Objective-C method name using $ notation
  methodImplementations["presentationAnchorForAuthorizationController$"] =
    callbacks.presentationAnchorForAuthorizationController;

  // Create and return the protocol implementation
  return NobjcProtocol.implement(
    "ASAuthorizationControllerPresentationContextProviding",
    methodImplementations
  );
}
