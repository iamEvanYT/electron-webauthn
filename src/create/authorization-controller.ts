import { NobjcClass, NobjcObject, getPointer } from "objc-js";
import { NSDataFromBuffer, type _NSData } from "../objc/foundation/nsdata.js";
import { NSArrayFromObjects } from "../objc/foundation/nsarray.js";
import { Foundation } from "../objc/foundation/index.js";
import { AuthenticationServices } from "../objc/authentication-services/index.js";
import type { ExcludeCredential } from "./handler.js";
import { NSStringFromString } from "../objc/foundation/nsstring.js";
import { createPublicKeyCredentialDescriptor } from "../objc/authentication-services/as-authorization-c-public-key-credential-descriptor.js";

const createControllerState = new Map<
  string,
  [Buffer, PublicKeyCredentialParams[], boolean, ExcludeCredential[]]
>();

function getObjectPointerString(self: NobjcObject) {
  return getPointer(self).toBase64();
}

export interface PublicKeyCredentialParams {
  type: "public-key";
  algorithm: number;
}

export function setControllerState(
  self: NobjcObject,
  clientDataHash: Buffer,
  pubKeyCredParams: PublicKeyCredentialParams[],
  residentKeyRequired: boolean,
  excludeCredentialIds: ExcludeCredential[]
) {
  const selfPointer = getObjectPointerString(self);
  createControllerState.set(selfPointer, [
    clientDataHash,
    pubKeyCredParams,
    residentKeyRequired,
    excludeCredentialIds,
  ]);
}

export function removeControllerState(self: NobjcObject) {
  const selfPointer = getObjectPointerString(self);
  createControllerState.delete(selfPointer);
}

export const WebauthnCreateController = NobjcClass.define({
  name: "WebauthnCreateController",
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

        // Grab the registration options, set the client data hash, and set a copy of the registration options back on the context
        const selfPointer = getObjectPointerString(self);
        if (createControllerState.has(selfPointer)) {
          const registrationOptions =
            context.platformKeyCredentialCreationOptions();

          const [
            clientDataHash,
            pubKeyCredParams,
            residentKeyRequired,
            excludeCredentials,
          ] = createControllerState.get(selfPointer);

          registrationOptions.setClientDataHash$(
            NSDataFromBuffer(clientDataHash)
          );
          registrationOptions.setChallenge$(null);

          // Set supported algorithm identifiers
          const supportedAlgos: number[] = [];
          for (const param of pubKeyCredParams) {
            if (param.type === "public-key") {
              supportedAlgos.push(param.algorithm);
            }
          }
          if (supportedAlgos.length > 0) {
            registrationOptions.setSupportedAlgorithmIdentifiers$(
              NSArrayFromObjects(supportedAlgos as unknown as NobjcObject[])
            );
          }

          // Set resident key requirement
          registrationOptions.setShouldRequireResidentKey$(residentKeyRequired);

          // Set excluded credentials
          const excludeList: NobjcObject[] = [];
          for (const cred of excludeCredentials) {
            // Convert transports to NSArray of NSString
            const transports: NobjcObject[] = [];
            if (cred.transports) {
              for (const transport of cred.transports) {
                transports.push(NSStringFromString(transport));
              }
            }

            // Create descriptor
            const credentialID = NSDataFromBuffer(cred.id);
            const transportsArray = NSArrayFromObjects(transports);

            const initializedDescriptor = createPublicKeyCredentialDescriptor(
              credentialID,
              transportsArray
            );
            excludeList.push(initializedDescriptor);
          }
          if (excludeList.length > 0) {
            registrationOptions.setExcludedCredentials$(
              NSArrayFromObjects(excludeList)
            );
          }
        }

        return context;
      },
    },
  },
});
