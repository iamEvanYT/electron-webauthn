import { base64UrlToBuffer, PromiseWithResolvers } from "../helpers/index.js";
import {
  removeClientDataHash,
  setClientDataHash,
  WebauthnGetController,
} from "../get/authorization-controller.js";
import { type PRFInput, createPRFInput } from "../helpers/prf.js";
import {
  generateClientDataInfo,
  generateWebauthnClientData,
} from "../helpers/client-data.js";
import { createPresentationContextProviderFromNativeWindowHandle } from "../helpers/presentation.js";
import type { AuthenticatorAttachment } from "../helpers/types.js";
import { NativeError } from "../helpers/validation.js";
import { NSStringFromString } from "objcjs-types/helpers";
import {
  ASAuthorizationPlatformPublicKeyCredentialProvider,
  ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput,
  ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation,
  ASAuthorizationPlatformPublicKeyCredentialDescriptor,
  ASAuthorizationSecurityKeyPublicKeyCredentialDescriptor,
  ASAuthorizationSecurityKeyPublicKeyCredentialProvider,
  ASAuthorizationPublicKeyCredentialPRFAssertionInput,
  ASAuthorizationPublicKeyCredentialAttachment,
  type _ASAuthorizationPlatformPublicKeyCredentialAssertionRequest,
  type _ASAuthorizationSecurityKeyPublicKeyCredentialAssertionRequest,
  type _ASAuthorizationPlatformPublicKeyCredentialAssertion,
  type _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion,
  type _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues,
  ASAuthorizationPlatformPublicKeyCredentialAssertion,
  ASAuthorizationSecurityKeyPublicKeyCredentialAssertion,
  type _ASAuthorizationControllerPresentationContextProviding,
} from "objcjs-types/AuthenticationServices";
import { NSDataFromBuffer, bufferFromNSDataDirect } from "objcjs-types/nsdata";
import { createDelegate } from "objcjs-types/delegates";
import {
  NSArray,
  NSDictionary,
  type _NSArray,
  type _NSDictionary,
  type _NSData,
  type _NSError,
} from "objcjs-types/Foundation";
import type { NobjcObject } from "objc-js";
import {
  NSArrayFromObjects,
  NSDictionaryFromKeysAndValues,
} from "objcjs-types/helpers";

export type UserVerificationPreference =
  | "preferred"
  | "required"
  | "discouraged";

const VALID_EXTENSIONS = ["largeBlobRead", "largeBlobWrite", "prf"] as const;
export type CredentialAssertionExtensions = (typeof VALID_EXTENSIONS)[number];

export interface GetCredentialResult {
  id: Buffer;
  authenticatorAttachment: AuthenticatorAttachment;
  clientDataJSON: Buffer;
  authenticatorData: Buffer;
  signature: Buffer;
  userHandle: Buffer | null;
  prf: [Buffer | null, Buffer | null];
  largeBlob: Buffer | null;
  largeBlobWritten: boolean | null;
}

export interface GetCredentialAdditionalOptions {
  // largeBlob extension
  largeBlobDataToWrite?: Buffer;

  // prf extension
  prf?: PRFInput;
  prfByCredential?: Record<string, PRFInput>;

  // iframes handling
  topFrameOrigin?: string;
}

function bufferFromOptionalNSData(
  data: _NSData | null | undefined
): Buffer | null {
  if (data == null) {
    return null;
  }
  return bufferFromNSDataDirect(data);
}

function setupPublicKeyCredentialRequest(
  type: "platform" | "security-key",
  keyRequest:
    | _ASAuthorizationPlatformPublicKeyCredentialAssertionRequest
    | _ASAuthorizationSecurityKeyPublicKeyCredentialAssertionRequest,
  userVerificationPreference: UserVerificationPreference,
  enabledExtensions: CredentialAssertionExtensions[],
  allowedCredentialIds: Buffer[],
  additionalOptions: GetCredentialAdditionalOptions
) {
  // keyRequest.userVerificationPreference = ???
  if (userVerificationPreference === "preferred") {
    keyRequest.setUserVerificationPreference$(NSStringFromString("preferred"));
  } else if (userVerificationPreference === "required") {
    keyRequest.setUserVerificationPreference$(NSStringFromString("required"));
  } else if (userVerificationPreference === "discouraged") {
    keyRequest.setUserVerificationPreference$(
      NSStringFromString("discouraged")
    );
  }

  // keyRequest.largeBlob = ??? (Only available for platform authenticator)
  if (type === "platform") {
    const largeBlobRead = enabledExtensions.includes("largeBlobRead");
    const largeBlobWrite = enabledExtensions.includes("largeBlobWrite");
    if (largeBlobRead) {
      const operation =
        ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation.Read;
      const largeBlobInput =
        ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput.alloc().initWithOperation$(
          operation
        );
      keyRequest.setLargeBlob$(largeBlobInput);
    } else if (largeBlobWrite) {
      if (additionalOptions.largeBlobDataToWrite) {
        const operation =
          ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation.Write;
        const largeBlobInput =
          ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput.alloc().initWithOperation$(
            operation
          );
        largeBlobInput.setDataToWrite$(
          NSDataFromBuffer(additionalOptions.largeBlobDataToWrite)
        );
        keyRequest.setLargeBlob$(largeBlobInput);
      } else {
        console.warn(
          "[electron-webauthn] largeBlobWrite is enabled but largeBlobDataToWrite is not provided, skipping large blob write"
        );
      }
    }
  }

  // keyRequest.prf = ??? (Only available for platform authenticator)
  if (type === "platform" && enabledExtensions.includes("prf")) {
    if (additionalOptions.prf || additionalOptions.prfByCredential) {
      let inputValues: _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues | null =
        null;
      if (additionalOptions.prf) {
        inputValues = createPRFInput(additionalOptions.prf);
      }

      let perCredentialInputValues: _NSDictionary | null = null;
      // evalByCredential is only applicable during assertions when allowCredentials is not empty. (https://www.w3.org/TR/webauthn-3/)
      if (
        additionalOptions.prfByCredential &&
        allowedCredentialIds.length > 0
      ) {
        const keys: _NSData[] = [];
        const values: _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues[] =
          [];

        for (const [credentialId, prfInput] of Object.entries(
          additionalOptions.prfByCredential
        )) {
          const credentialIdBuffer = base64UrlToBuffer(credentialId);
          const credentialIdData = NSDataFromBuffer(credentialIdBuffer);
          keys.push(credentialIdData);
          values.push(createPRFInput(prfInput));
        }

        perCredentialInputValues = NSDictionaryFromKeysAndValues(keys, values);
      }

      const prfInput =
        ASAuthorizationPublicKeyCredentialPRFAssertionInput.alloc().initWithInputValues$perCredentialInputValues$(
          inputValues,
          perCredentialInputValues
        );
      keyRequest.setPrf$(prfInput);
    } else {
      console.warn(
        "[electron-webauthn] prf is enabled but prf or prfByCredential is not provided, skipping PRF"
      );
    }
  }
}

function getCredentialInternal(
  rpid: string,
  challenge: Buffer,
  nativeWindowHandle: Buffer,
  origin: string,
  timeout: number,
  enabledExtensions: CredentialAssertionExtensions[] = [],
  allowedCredentialIds: Buffer[],
  userVerificationPreference?: UserVerificationPreference,
  additionalOptions: GetCredentialAdditionalOptions = {}
): Promise<GetCredentialResult> {
  const { promise, resolve, reject } =
    PromiseWithResolvers<GetCredentialResult>();

  // Create NS objects
  const NS_rpID = NSStringFromString(rpid);

  // let challenge: Data // Obtain this from the server.
  const NS_challenge = NSDataFromBuffer(challenge);

  // let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
  const platformProvider =
    ASAuthorizationPlatformPublicKeyCredentialProvider.alloc().initWithRelyingPartyIdentifier$(
      NS_rpID
    );

  // let platformKeyRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)
  const platformKeyRequest =
    platformProvider.createCredentialAssertionRequestWithChallenge$(
      NS_challenge
    );

  setupPublicKeyCredentialRequest(
    "platform",
    platformKeyRequest,
    userVerificationPreference,
    enabledExtensions,
    allowedCredentialIds,
    additionalOptions
  );

  // let securityKeyProvider = ASAuthorizationSecurityKeyPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
  const securityKeyProvider =
    ASAuthorizationSecurityKeyPublicKeyCredentialProvider.alloc().initWithRelyingPartyIdentifier$(
      NS_rpID
    );

  // let securityKeyRequest = securityKeyProvider.createCredentialAssertionRequest(challenge: challenge)
  const securityKeyRequest =
    securityKeyProvider.createCredentialAssertionRequestWithChallenge$(
      NS_challenge
    );

  setupPublicKeyCredentialRequest(
    "security-key",
    securityKeyRequest,
    userVerificationPreference,
    enabledExtensions,
    allowedCredentialIds,
    additionalOptions
  );

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArrayFromObjects([
    platformKeyRequest,
    securityKeyRequest,
  ]);
  const authController =
    WebauthnGetController.alloc().initWithAuthorizationRequests$(requestsArray);
  // OLD: const authController = createAuthorizationController(requestsArray);

  // Generate our own client data instead of letting apple generate it
  //  This is because apple's client data lack the `crossOrigin` field, which is required by a lot of sites.
  const clientData = generateWebauthnClientData(
    "webauthn.get",
    origin,
    challenge,
    additionalOptions.topFrameOrigin
  );

  const { clientDataHash, clientDataBuffer } =
    generateClientDataInfo(clientData);

  let isFinished = false;
  let timeoutHandlerId: NodeJS.Timeout | null = null;
  const finished = (_success: boolean) => {
    if (isFinished) {
      return;
    }
    isFinished = true;
    removeClientDataHash(authController);

    if (timeoutHandlerId) {
      clearTimeout(timeoutHandlerId);
      timeoutHandlerId = null;
    }
  };
  const failConfiguration = (error: unknown) => {
    if (isFinished) {
      return;
    }
    reject(error instanceof Error ? error : new Error(String(error)));
    finished(false);
    try {
      authController.cancel();
    } catch {}
  };

  setClientDataHash(authController, clientDataHash, failConfiguration);

  // Set allowed credentials if provided. Must be set on both requests - only setting it
  // on platformKeyRequest left the security-key request unrestricted, letting any resident
  // credential on the key be used even when the RP only allow-listed specific credential IDs.
  if (allowedCredentialIds.length > 0) {
    const allowedPlatformCredentials = NSArrayFromObjects(
      allowedCredentialIds.map((id) =>
        ASAuthorizationPlatformPublicKeyCredentialDescriptor.alloc().initWithCredentialID$(
          NSDataFromBuffer(id)
        )
      )
    );
    platformKeyRequest.setAllowedCredentials$(allowedPlatformCredentials);

    const allowedSecurityKeyCredentials = NSArrayFromObjects(
      allowedCredentialIds.map((id) =>
        ASAuthorizationSecurityKeyPublicKeyCredentialDescriptor.alloc().initWithCredentialID$transports$(
          NSDataFromBuffer(id),
          NSArrayFromObjects([])
        )
      )
    );
    securityKeyRequest.setAllowedCredentials$(allowedSecurityKeyCredentials);
  }

  // authController.delegate = self
  const delegate = createDelegate("ASAuthorizationControllerDelegate", {
    authorizationController$didCompleteWithAuthorization$: (
      _,
      authorization
    ) => {
      if (isFinished) {
        return;
      }
      // Without try/catch, a throw here is swallowed by objc-js and the promise hangs.
      try {
        const credential = authorization.credential();

        const isPlatform =
          credential instanceof
          ASAuthorizationPlatformPublicKeyCredentialAssertion;
        const isSecurityKey =
          credential instanceof
          ASAuthorizationSecurityKeyPublicKeyCredentialAssertion;
        if (!isPlatform && !isSecurityKey) {
          failConfiguration(
            new Error(
              "Resulting credential is not a platform or security key credential"
            )
          );
          return;
        }

        const id_data = credential.credentialID();
        const id = bufferFromNSDataDirect(id_data);

        let authenticatorAttachment: AuthenticatorAttachment =
          "cross-platform";
        if (
          isPlatform &&
          credential.attachment() ===
            ASAuthorizationPublicKeyCredentialAttachment.Platform
        ) {
          authenticatorAttachment = "platform";
        }

        // Security-key assertions often throw if prf/largeBlob were never requested.
        let prfFirst: Buffer | null = null;
        let prfSecond: Buffer | null = null;
        if (enabledExtensions.includes("prf")) {
          const prfOutput = credential.prf();
          if (prfOutput) {
            const prfFirstData = prfOutput.first();
            const prfSecondData = prfOutput.second();
            if (prfFirstData) {
              prfFirst = bufferFromNSDataDirect(prfFirstData);
            }
            if (prfSecondData) {
              prfSecond = bufferFromNSDataDirect(prfSecondData);
            }
          }
        }

        let largeBlobBuffer: Buffer | null = null;
        let largeBlobWritten: boolean | null = null;
        if (
          enabledExtensions.includes("largeBlobRead") ||
          enabledExtensions.includes("largeBlobWrite")
        ) {
          const largeBlobOutput = credential.largeBlob();
          if (largeBlobOutput) {
            const largeBlobData = largeBlobOutput.readData();
            if (largeBlobData) {
              largeBlobBuffer = bufferFromNSDataDirect(largeBlobData);
            } else {
              largeBlobWritten = largeBlobOutput.didWrite();
            }
          }
        }

        resolve({
          id,
          authenticatorAttachment,
          clientDataJSON: clientDataBuffer, //bufferFromNSDataDirect(credential.rawClientDataJSON()),
          authenticatorData: bufferFromNSDataDirect(
            credential.rawAuthenticatorData()
          ),
          signature: bufferFromNSDataDirect(credential.signature()),
          userHandle: bufferFromOptionalNSData(credential.userID()),
          prf: [prfFirst, prfSecond],
          largeBlob: largeBlobBuffer,
          largeBlobWritten,
        });

        finished(true);
      } catch (error) {
        failConfiguration(error);
      }
    },
    authorizationController$didCompleteWithError$: (_, error) => {
      try {
        failConfiguration(NativeError.fromNSError(error));
      } catch (callbackError) {
        failConfiguration(callbackError);
      }
    },
  });
  authController.setDelegate$(delegate);

  // authController.presentationContextProvider = self
  const presentationContextProvider =
    createPresentationContextProviderFromNativeWindowHandle(
      nativeWindowHandle
    ) as _ASAuthorizationControllerPresentationContextProviding;
  authController.setPresentationContextProvider$(presentationContextProvider);

  // authController.performRequests()
  try {
    authController.performRequests();
  } catch (error) {
    failConfiguration(error);
  }

  if (isFinished) return promise;

  // After Apple already completed, cancel() is a no-op and will not reject.
  timeoutHandlerId = setTimeout(() => {
    failConfiguration(new Error("The operation timed out."));
  }, timeout);

  return promise;
}

export { getCredentialInternal };
