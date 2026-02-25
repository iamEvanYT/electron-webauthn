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
import { NSStringFromString } from "objcjs-types/helpers";
import {
  ASAuthorizationPlatformPublicKeyCredentialProvider,
  ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput,
  ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation,
  ASAuthorizationPlatformPublicKeyCredentialDescriptor,
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
  userHandle: Buffer;
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

  setClientDataHash(authController, clientDataHash);

  let isFinished = false;
  let timeoutHandlerId: NodeJS.Timeout | null = null;
  const finished = (_success: boolean) => {
    isFinished = true;
    removeClientDataHash(authController);

    if (timeoutHandlerId) {
      clearTimeout(timeoutHandlerId);
      timeoutHandlerId = null;
    }
  };

  // Set allowed credentials if provided
  if (allowedCredentialIds.length > 0) {
    const allowedCredentials = NSArrayFromObjects(
      allowedCredentialIds.map((id) =>
        ASAuthorizationPlatformPublicKeyCredentialDescriptor.alloc().initWithCredentialID$(
          NSDataFromBuffer(id)
        )
      )
    );
    platformKeyRequest.setAllowedCredentials$(allowedCredentials);
  }

  // authController.delegate = self
  const delegate = createDelegate("ASAuthorizationControllerDelegate", {
    authorizationController$didCompleteWithAuthorization$: (
      _,
      authorization
    ) => {
      const credential = authorization.credential();
      // console.log("Authorization succeeded:", credential);

      const isPlatform =
        credential instanceof
        ASAuthorizationPlatformPublicKeyCredentialAssertion;
      const isSecurityKey =
        credential instanceof
        ASAuthorizationSecurityKeyPublicKeyCredentialAssertion;
      if (!isPlatform && !isSecurityKey) {
        reject(
          new Error(
            "Resulting credential is not a platform or security key credential"
          )
        );
        finished(false);
        return;
      }

      const id_data = credential.credentialID();
      const id = bufferFromNSDataDirect(id_data);

      let authenticatorAttachment: AuthenticatorAttachment = "cross-platform";
      if (
        isPlatform &&
        credential.attachment() ===
          ASAuthorizationPublicKeyCredentialAttachment.Platform
      ) {
        authenticatorAttachment = "platform";
      }

      const prf = credential.prf();
      const prfFirst = prf?.first ? prf.first() : null;
      const prfSecond = prf?.second ? prf.second() : null;

      let largeBlobBuffer: Buffer | null = null;
      let largeBlobWritten: boolean | null = null;
      if (credential.largeBlob()) {
        const largeBlobData = credential.largeBlob().readData();
        if (largeBlobData) {
          largeBlobBuffer = bufferFromNSDataDirect(largeBlobData);
        } else {
          largeBlobWritten = credential.largeBlob().didWrite();
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
        userHandle: bufferFromNSDataDirect(credential.userID()),
        prf: [
          prfFirst ? bufferFromNSDataDirect(prfFirst) : null,
          prfSecond ? bufferFromNSDataDirect(prfSecond) : null,
        ],
        largeBlob: largeBlobBuffer,
        largeBlobWritten,
      });

      finished(true);
    },
    authorizationController$didCompleteWithError$: (_, error) => {
      const errorMessage = error.localizedDescription().UTF8String();
      // console.error("Authorization failed:", errorMessage);

      reject(new Error(errorMessage));
      finished(false);
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
  authController.performRequests();

  // Cancelling auth controller on timeout
  timeoutHandlerId = setTimeout(() => {
    if (isFinished) return;
    authController.cancel();
  }, timeout);

  return promise;
}

export { getCredentialInternal };
