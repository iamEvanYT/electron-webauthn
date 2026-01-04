import { fromPointer } from "objc-js";
import { createAuthorizationControllerDelegate } from "./objc/authentication-services/as-authorization-controller-delegate.js";
import { ASAuthorizationController } from "./objc/authentication-services/as-authorization-controller.js";
import { createPresentationContextProvider } from "./objc/authentication-services/as-authorization-controller-presentation-context-providing.js";
import { createPlatformPublicKeyCredentialProvider } from "./objc/authentication-services/as-authorization-platform-public-key-credential-provider.js";
import { createPlatformPublicKeyCredentialDescriptor } from "./objc/authentication-services/as-authorization-platform-public-key-credential-descriptor.js";
import type { _ASAuthorization } from "./objc/authentication-services/as-authorization.js";
import type { _ASAuthorizationPlatformPublicKeyCredentialAssertion } from "./objc/authentication-services/as-authorization-platform-public-key-credential-assertion.js";
import { NSArray, NSArrayFromObjects } from "./objc/foundation/nsarray.js";
import {
  type _NSData,
  bufferFromNSDataDirect,
  NSDataFromBuffer,
} from "./objc/foundation/nsdata.js";
import { NSStringFromString } from "./objc/foundation/nsstring.js";
import type { _NSError } from "./objc/foundation/nserror.js";
import type { _NSView } from "./objc/foundation/nsview.js";
import {
  bufferToBase64Url,
  clientDataJsonBufferToHash,
  PromiseWithResolvers,
  serializeOrigin,
} from "./helpers.js";
import { ASAuthorizationPublicKeyCredentialAttachment } from "./objc/authentication-services/enums/as-authorization-public-key-credential-attachment.js";
import {
  removeClientDataHash,
  setClientDataHash,
  WebauthnGetController,
} from "./get-authorization-controller.js";

type AuthenticatorAttachment = "platform" | "cross-platform";
export type UserVerificationPreference =
  | "preferred"
  | "required"
  | "discouraged";

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

function getCredential(
  rpid: string,
  challenge: Buffer,
  nativeWindowHandle: Buffer,
  origin: string,
  allowedCredentialIds: Buffer[],
  userVerificationPreference?: UserVerificationPreference
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

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArray.arrayWithObject$(platformKeyRequest);
  const authController: typeof ASAuthorizationController.prototype =
    WebauthnGetController.alloc().initWithAuthorizationRequests$(requestsArray);
  // OLD: const authController = createAuthorizationController(requestsArray);

  // Generate the client data
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
  console.log("clientDataJSON", clientDataJSON);

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
      const credential =
        authorization.credential() as unknown as _ASAuthorizationPlatformPublicKeyCredentialAssertion;
      console.log("Authorization succeeded:", credential);

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

      console.log("rawAuthenticatorData", credential.rawAuthenticatorData());

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
        largeBlob: credential.largeBlob()
          ? bufferFromNSDataDirect(credential.largeBlob().readData())
          : null,
      });

      finished(true);
    },
    didCompleteWithError: (_, error) => {
      // Parse the NSError into a readable format
      const parsedError = error as unknown as typeof _NSError.prototype;
      const errorMessage = parsedError.localizedDescription().UTF8String();
      console.error("Authorization failed:", errorMessage);
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
  console.log("performing requests");
  authController.performRequests();

  return promise;
}

export { getCredential };
