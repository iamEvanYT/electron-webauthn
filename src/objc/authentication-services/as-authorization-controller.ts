import { AuthenticationServices } from "./index.js";
import type { NobjcObject } from "objc-js";

// Class declaration
declare class _ASAuthorizationController extends NobjcObject {
  /**
   * ASAuthorizationController.init(authorizationRequests: NSArray<ASAuthorizationRequest>)
   * @private Do not use this method directly.
   */
  initWithAuthorizationRequests$(
    authorizationRequests: NobjcObject
  ): _ASAuthorizationController;

  /**
   * ASAuthorizationController.performRequests()
   */
  performRequests(): void;

  // Perform requests with options (macOS 12.0+)
  performRequestsWithOptions$(options: NobjcObject): void;

  // Perform auto-fill assisted requests
  performAutoFillAssistedRequests(): void;

  // Cancel requests
  cancel(): void;

  // Delegate (property setter/getter)
  setDelegate$(delegate: NobjcObject): void;
  delegate(): NobjcObject;

  // Presentation context provider (property setter/getter)
  setPresentationContextProvider$(provider: NobjcObject): void;
  presentationContextProvider(): NobjcObject;
}

export const ASAuthorizationController =
  AuthenticationServices.ASAuthorizationController as unknown as typeof _ASAuthorizationController;

// Helper Functions

/**
 * Create an ASAuthorizationController instance
 * @param authorizationRequests An NSArray of authorization requests
 * @returns An initialized controller instance
 */
export function createAuthorizationController(
  authorizationRequests: NobjcObject
): _ASAuthorizationController {
  const instance = (ASAuthorizationController as any).alloc();
  return instance.initWithAuthorizationRequests$(authorizationRequests);
}
