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

        // Grab the assertion options, set the client data hash, and set a copy of the assertion options back on the context
        const selfPointer = getObjectPointerString(self);
        if (getControllerState.has(selfPointer)) {
          let assertionOptions =
            context.platformKeyCredentialAssertionOptions();
          if (!assertionOptions) {
            assertionOptions = context.securityKeyCredentialAssertionOptions();
          }

          const clientDataHash = getControllerState.get(selfPointer);
          assertionOptions.setClientDataHash$(NSDataFromBuffer(clientDataHash));

          context.setPlatformKeyCredentialAssertionOptions$(
            assertionOptions.copyWithZone$(null)
          );
        }

        return context;
      },
    },
  },
}) as unknown as typeof ASAuthorizationController;
// Basically just ASAuthorizationController with slight bit of overrides ^
