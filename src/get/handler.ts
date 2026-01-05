import { fromPointer } from "objc-js";
import { createAuthorizationControllerDelegate } from "../objc/authentication-services/as-authorization-controller-delegate.js";
import { ASAuthorizationController } from "../objc/authentication-services/as-authorization-controller.js";
import { createPresentationContextProvider } from "../objc/authentication-services/as-authorization-controller-presentation-context-providing.js";
import { createPlatformPublicKeyCredentialProvider } from "../objc/authentication-services/as-authorization-platform-public-key-credential-provider.js";
import { createPlatformPublicKeyCredentialDescriptor } from "../objc/authentication-services/as-authorization-platform-public-key-credential-descriptor.js";
import type { _ASAuthorization } from "../objc/authentication-services/as-authorization.js";
import type { _ASAuthorizationPlatformPublicKeyCredentialAssertion } from "../objc/authentication-services/as-authorization-platform-public-key-credential-assertion.js";
import { NSArrayFromObjects } from "../objc/foundation/nsarray.js";
import {
  type _NSData,
  bufferFromNSDataDirect,
  NSDataFromBuffer,
} from "../objc/foundation/nsdata.js";
import { NSStringFromString } from "../objc/foundation/nsstring.js";
import type { _NSError } from "../objc/foundation/nserror.js";
import type { _NSView } from "../objc/foundation/nsview.js";
import {
  base64UrlToBuffer,
  bufferToBase64Url,
  clientDataJsonBufferToHash,
  PromiseWithResolvers,
  serializeOrigin,
} from "../helpers.js";
import { ASAuthorizationPublicKeyCredentialAttachment } from "../objc/authentication-services/enums/as-authorization-public-key-credential-attachment.js";
import {
  removeClientDataHash,
  setClientDataHash,
  WebauthnGetController,
} from "../get/authorization-controller.js";
import { createSecurityKeyPublicKeyCredentialProvider } from "../objc/authentication-services/as-authorization-security-key-public-key-credential-provider.js";
import type { _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion } from "../objc/authentication-services/as-authorization-platform-security-key-credential-assertion.js";
import { createASAuthorizationPublicKeyCredentialLargeBlobAssertionInput } from "../objc/authentication-services/as-authorization-public-key-credential-large-blob-assertion-input.js";
import { ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation } from "../objc/authentication-services/enums/as-authorization-public-key-credential-large-blob-assertion-operation.js";
import { createASAuthorizationPublicKeyCredentialPRFAssertionInput } from "../objc/authentication-services/as-authorization-public-key-credential-prf-assertion-input.js";
import { type _ASAuthorizationPublicKeyCredentialPRFAssertionInputValues } from "../objc/authentication-services/as-authorization-public-key-credential-prf-assertion-input-valuesas-authorization-public-key-credential-prf-assertion-input-values.js";
import { type PRFInput, createPRFInput } from "../prf.js";
import {
  NSDictionaryFromKeysAndValues,
  type _NSDictionary,
} from "../objc/foundation/nsdictionary.js";

type AuthenticatorAttachment = "platform" | "cross-platform";
export type UserVerificationPreference =
  | "preferred"
  | "required"
  | "discouraged";

export type CredentialAssertionExtensions =
  | "largeBlobRead"
  | "largeBlobWrite"
  | "prf";

export interface GetCredentialResult {
  id: Buffer;
  authenticatorAttachment: AuthenticatorAttachment;
  clientDataJSON: Buffer;
  authenticatorData: Buffer;
  signature: Buffer;
  userHandle: Buffer;
  prf: [Buffer | null, Buffer | null];
  largeBlob: Buffer | null;
}

export interface GetCredentialAdditionalOptions {
  largeBlobDataToWrite?: Buffer;
  prf?: PRFInput;
  prfByCredential?: Record<string, PRFInput>;
}

function getCredential(
  rpid: string,
  challenge: Buffer,
  nativeWindowHandle: Buffer,
  origin: string,
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
  const platformProvider = createPlatformPublicKeyCredentialProvider(NS_rpID);

  // let platformKeyRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)
  const platformKeyRequest =
    platformProvider.createCredentialAssertionRequestWithChallenge$(
      NS_challenge
    );

  // platformKeyRequest.userVerificationPreference = ???
  if (userVerificationPreference === "preferred") {
    platformKeyRequest.setUserVerificationPreference$(
      NSStringFromString("preferred")
    );
  } else if (userVerificationPreference === "required") {
    platformKeyRequest.setUserVerificationPreference$(
      NSStringFromString("required")
    );
  } else if (userVerificationPreference === "discouraged") {
    platformKeyRequest.setUserVerificationPreference$(
      NSStringFromString("discouraged")
    );
  }

  // platformKeyRequest.largeBlob = ???
  const largeBlobRead = enabledExtensions.includes("largeBlobRead");
  const largeBlobWrite = enabledExtensions.includes("largeBlobWrite");
  if (largeBlobRead) {
    const operation =
      ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation.Read;
    const largeBlobInput =
      createASAuthorizationPublicKeyCredentialLargeBlobAssertionInput(
        operation
      );

    platformKeyRequest.setLargeBlob$(largeBlobInput);
  } else if (largeBlobWrite) {
    if (additionalOptions.largeBlobDataToWrite) {
      const operation =
        ASAuthorizationPublicKeyCredentialLargeBlobAssertionOperation.Write;
      const largeBlobInput =
        createASAuthorizationPublicKeyCredentialLargeBlobAssertionInput(
          operation
        );

      largeBlobInput.setDataToWrite$(
        NSDataFromBuffer(additionalOptions.largeBlobDataToWrite)
      );
      platformKeyRequest.setLargeBlob$(largeBlobInput);
    } else {
      console.warn(
        "[electron-webauthn] largeBlobWrite is enabled but largeBlobDataToWrite is not provided, skipping large blob write"
      );
    }
  }

  // platformKeyRequest.prf = ???
  if (enabledExtensions.includes("prf")) {
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
        createASAuthorizationPublicKeyCredentialPRFAssertionInput(
          inputValues,
          perCredentialInputValues
        );
      platformKeyRequest.setPrf$(prfInput);
    } else {
      console.warn(
        "[electron-webauthn] prf is enabled but prf or prfByCredential is not provided, skipping PRF"
      );
    }
  }

  // let securityKeyProvider = ASAuthorizationSecurityKeyPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
  const securityKeyProvider =
    createSecurityKeyPublicKeyCredentialProvider(NS_rpID);

  // let securityKeyRequest = securityKeyProvider.createCredentialAssertionRequest(challenge: challenge)
  const securityKeyRequest =
    securityKeyProvider.createCredentialAssertionRequestWithChallenge$(
      NS_challenge
    );

  // securityKeyRequest.userVerificationPreference = ???
  if (userVerificationPreference === "preferred") {
    securityKeyRequest.setUserVerificationPreference$(
      NSStringFromString("preferred")
    );
  } else if (userVerificationPreference === "required") {
    securityKeyRequest.setUserVerificationPreference$(
      NSStringFromString("required")
    );
  } else if (userVerificationPreference === "discouraged") {
    securityKeyRequest.setUserVerificationPreference$(
      NSStringFromString("discouraged")
    );
  }

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArrayFromObjects([
    platformKeyRequest,
    securityKeyRequest,
  ]);
  const authController: typeof ASAuthorizationController.prototype =
    WebauthnGetController.alloc().initWithAuthorizationRequests$(requestsArray);
  // OLD: const authController = createAuthorizationController(requestsArray);

  // Generate our own client data instead of letting apple generate it
  //  This is because apple's client data lack the `crossOrigin` field, which is required by a lot of sites.
  const serializedOrigin = serializeOrigin(origin);
  const clientData = {
    type: "webauthn.get",
    challenge: bufferToBase64Url(challenge),
    origin: serializedOrigin,
    crossOrigin: false,
  };

  const clientDataJSON = JSON.stringify(clientData);
  const clientDataBuffer = Buffer.from(clientDataJSON, "utf-8");
  const clientDataHash = clientDataJsonBufferToHash(clientDataBuffer);

  setClientDataHash(authController, clientDataHash);

  const finished = (_success: boolean) => {
    removeClientDataHash(authController);
  };

  // Set allowed credentials if provided
  if (allowedCredentialIds.length > 0) {
    const allowedCredentials = NSArrayFromObjects(
      allowedCredentialIds.map((id) =>
        createPlatformPublicKeyCredentialDescriptor(NSDataFromBuffer(id))
      )
    );
    platformKeyRequest.setAllowedCredentials$(allowedCredentials);
  }

  // authController.delegate = self
  const delegate = createAuthorizationControllerDelegate({
    didCompleteWithAuthorization: (_, authorization) => {
      // Cast to _ASAuthorization to access typed methods
      const credential = authorization.credential() as unknown as
        | _ASAuthorizationPlatformPublicKeyCredentialAssertion
        | _ASAuthorizationSecurityKeyPublicKeyCredentialAssertion;
      // console.log("Authorization succeeded:", credential);

      const id_data = credential.credentialID();
      const id = bufferFromNSDataDirect(id_data);

      let authenticatorAttachment: AuthenticatorAttachment = "platform";
      if (
        credential.attachment() ===
        ASAuthorizationPublicKeyCredentialAttachment.ASAuthorizationPublicKeyCredentialAttachmentCrossPlatform
      ) {
        authenticatorAttachment = "cross-platform";
      }

      const prf = credential.prf();
      const prfFirst = prf?.first ? prf.first() : null;
      const prfSecond = prf?.second ? prf.second() : null;

      let largeBlobBuffer: Buffer | null = null;
      if (credential.largeBlob()) {
        const largeBlobData = credential.largeBlob().readData();
        if (largeBlobData) {
          largeBlobBuffer = bufferFromNSDataDirect(largeBlobData);
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
      });

      finished(true);
    },
    didCompleteWithError: (_, error) => {
      // Parse the NSError into a readable format
      const parsedError = error as unknown as typeof _NSError.prototype;
      const errorMessage = parsedError.localizedDescription().UTF8String();
      // console.error("Authorization failed:", errorMessage);

      reject(new Error(errorMessage));

      finished(false);
    },
  });
  authController.setDelegate$(delegate);

  // authController.presentationContextProvider = self
  const presentationContextProvider = createPresentationContextProvider({
    presentationAnchorForAuthorizationController: () => {
      // Return the NSWindow to present the authorization UI in
      const nsView = fromPointer(nativeWindowHandle) as unknown as _NSView;
      const nsWindow = nsView.window();
      return nsWindow;
    },
  });
  authController.setPresentationContextProvider$(presentationContextProvider);

  // authController.performRequests()
  authController.performRequests();

  return promise;
}

export { getCredential };
