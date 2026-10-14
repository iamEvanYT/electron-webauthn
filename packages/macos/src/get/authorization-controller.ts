import { NobjcClass, NobjcObject, getPointer } from "objc-js";
import type { ASAuthorizationController } from "objcjs-types/AuthenticationServices";
import { NSDataFromBuffer } from "objcjs-types/nsdata";

const getControllerState = new Map<string, Buffer>();

function getObjectPointerString(self: NobjcObject) {
  return getPointer(self).toString("base64");
}

export function setClientDataHash(self: NobjcObject, clientDataHash: Buffer) {
  const selfPointer = getObjectPointerString(self);
  getControllerState.set(selfPointer, clientDataHash);
}

export function removeClientDataHash(self: NobjcObject) {
  const selfPointer = getObjectPointerString(self);
  getControllerState.delete(selfPointer);
}

export const WebauthnGetController = NobjcClass.define({
  name: "WebauthnGetController",
  superclass: "ASAuthorizationController",
  methods: {
    // This overrides the default implementation of _requestContextWithRequests$error$ to allow us to set the clientDataHash on the assertion options
    _requestContextWithRequests$error$: {
      types: "@@:@^@",
      implementation: (self: any, requests: any, outError: any) => {
        const context = NobjcClass.super(
          self,
          "_requestContextWithRequests$error$",
          requests,
          outError
        );

        // Grab the assertion options for every request type that is present and set the client data hash on each.
        // Both must be patched: the user can pick either authenticator when both are requested.
        const selfPointer = getObjectPointerString(self);
        if (context && getControllerState.has(selfPointer)) {
          const clientDataHash = NSDataFromBuffer(
            getControllerState.get(selfPointer)
          );

          const platformOptions = context.platformKeyCredentialAssertionOptions();
          if (platformOptions) {
            platformOptions.setClientDataHash$(clientDataHash);
            context.setPlatformKeyCredentialAssertionOptions$(
              platformOptions.copyWithZone$(null)
            );
          }

          const securityKeyOptions =
            context.securityKeyCredentialAssertionOptions();
          if (securityKeyOptions) {
            securityKeyOptions.setClientDataHash$(clientDataHash);
          }
        }

        return context;
      },
    },
  },
}) as unknown as typeof ASAuthorizationController;
// Basically just ASAuthorizationController with slight bit of overrides ^
