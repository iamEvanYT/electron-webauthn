import { fromPointer, getPointer } from "objc-js";
import { createAuthorizationControllerDelegate } from "./objc/authentication-services/as-authorization-controller-delegate.js";
import { createAuthorizationController } from "./objc/authentication-services/as-authorization-controller.js";
import { createPresentationContextProvider } from "./objc/authentication-services/as-authorization-controller-presentation-context-providing.js";
import { createPlatformPublicKeyCredentialProvider } from "./objc/authentication-services/as-authorization-platform-public-key-credential-provider.js";
import { NSArray } from "./objc/foundation/nsarray.js";
import { NSDataFromBuffer } from "./objc/foundation/nsdata.js";
import { NSStringFromString } from "./objc/foundation/nsstring.js";
import { _NSError } from "./objc/foundation/nserror.js";
import { createEmptyWindow, getNativeWindowHandle } from "./window.js";
import type { _NSView } from "./objc/foundation/nsview.js";

const window = createEmptyWindow();
const nsView = getNativeWindowHandle(window);
const nsViewPointer = getPointer(nsView);

function getCredential(
  rpid: string,
  challenge: Buffer,
  nativeWindowHandle: Buffer
) {
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

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArray.arrayWithObject$(platformKeyRequest);
  const authController = createAuthorizationController(requestsArray);

  // authController.delegate = self
  const delegate = createAuthorizationControllerDelegate({
    didCompleteWithAuthorization: (controller, authorization) => {
      console.log("Authorization succeeded:", authorization);
    },
    didCompleteWithError: (controller, error) => {
      // Parse the NSError into a readable format
      const parsedError = error as unknown as typeof _NSError.prototype;
      console.error(
        "Authorization failed:",
        parsedError.localizedDescription().UTF8String()
      );
    },
  });
  authController.setDelegate$(delegate);

  // authController.presentationContextProvider = self
  const presentationContextProvider = createPresentationContextProvider({
    presentationAnchorForAuthorizationController: (controller) => {
      // Return the NSWindow to present the authorization UI in
      const nsView = fromPointer(nsViewPointer) as unknown as _NSView;
      const nsWindow = nsView.window();
      return nsWindow;
    },
  });
  authController.setPresentationContextProvider$(presentationContextProvider);

  // authController.performRequests()
  authController.performRequests();

  return authController;
}

const result = getCredential(
  "example.com",
  Buffer.from("challenge"),
  nsViewPointer
);
console.log("Result:", result);
