import { NobjcClass, NobjcObject, getPointer } from "objc-js";
import type { ASAuthorizationController } from "objcjs-types/AuthenticationServices";
import { NSDataFromBuffer } from "objcjs-types/nsdata";

interface GetControllerState {
  clientDataHash: Buffer;
  onConfigurationError: (error: unknown) => void;
}

const getControllerState = new Map<string, GetControllerState>();

function getObjectPointerString(self: NobjcObject) {
  return getPointer(self).toString("base64");
}

export function setClientDataHash(
  self: NobjcObject,
  clientDataHash: Buffer,
  onConfigurationError: (error: unknown) => void
) {
  const selfPointer = getObjectPointerString(self);
  getControllerState.set(selfPointer, {
    clientDataHash,
    onConfigurationError,
  });
}

export function removeClientDataHash(self: NobjcObject) {
  const selfPointer = getObjectPointerString(self);
  getControllerState.delete(selfPointer);
}

export const WebauthnGetController = NobjcClass.define({
  name: "WebauthnGetController",
  superclass: "ASAuthorizationController",
  methods: {
    // Overrides _requestContextWithRequests$error$ to inject our clientDataHash into BOTH
    // platform and security-key assertion options. Previously only the platform variant was
    // mutated (with security-key used as a fallback), so security-key get requests signed
    // a clientDataJSON that didn't match what we returned to the page and the relying party
    // couldn't verify the assertion.
    _requestContextWithRequests$error$: {
      types: "@@:@^@",
      implementation: (self: any, requests: any, outError: any) => {
        const context = NobjcClass.super(
          self,
          "_requestContextWithRequests$error$",
          requests,
          outError
        );

        const selfPointer = getObjectPointerString(self);
        const state = getControllerState.get(selfPointer);
        if (state) {
          const { clientDataHash, onConfigurationError } = state;

          try {
            const platformOptions =
              context.platformKeyCredentialAssertionOptions();
            if (platformOptions) {
              platformOptions.setClientDataHash$(
                NSDataFromBuffer(clientDataHash)
              );
              context.setPlatformKeyCredentialAssertionOptions$(
                platformOptions.copyWithZone$(null)
              );
            }

            // Mirror on security-key options. These selectors are private, so fail the
            // ceremony if either is unavailable rather than leaving an unpatched request
            // active with a clientDataHash that does not match the returned clientDataJSON.
            const securityKeyOptions =
              context.securityKeyCredentialAssertionOptions();
            if (securityKeyOptions) {
              securityKeyOptions.setClientDataHash$(
                NSDataFromBuffer(clientDataHash)
              );
              context.setSecurityKeyCredentialAssertionOptions$(
                securityKeyOptions.copyWithZone$(null)
              );
            }
          } catch (error) {
            onConfigurationError(error);
          }
        }

        return context;
      },
    },
  },
}) as unknown as typeof ASAuthorizationController;
// Basically just ASAuthorizationController with slight bit of overrides ^
