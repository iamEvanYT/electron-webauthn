import { generateClientDataInfo } from "../helpers/client-data.js";
import { generateWebauthnClientData } from "../helpers/client-data.js";
import { PromiseWithResolvers } from "../helpers/index.js";
import { encodeEC2PublicKeyToSPKI } from "../helpers/public-key.js";
import { createPresentationContextProviderFromNativeWindowHandle } from "../helpers/presentation.js";
import { createPRFInput, type PRFInput } from "../helpers/prf.js";
import { createAuthorizationControllerDelegate } from "../objc/authentication-services/as-authorization-controller-delegate.js";
import type { ASAuthorizationController } from "../objc/authentication-services/as-authorization-controller.js";
import { createPlatformPublicKeyCredentialProvider } from "../objc/authentication-services/as-authorization-platform-public-key-credential-provider.js";
import { createASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput } from "../objc/authentication-services/as-authorization-public-key-credential-large-blob-registration-input.js";
import type { _ASAuthorizationPlatformPublicKeyCredentialRegistration } from "../objc/authentication-services/as-authorization-platform-public-key-credential-registration.js";
import {
  ASAuthorizationPublicKeyCredentialPRFRegistrationInput,
  createASAuthorizationPublicKeyCredentialPRFRegistrationInput,
} from "../objc/authentication-services/as-authorization-public-key-credential-prf-registration-input.js";
import { ASAuthorizationPublicKeyCredentialAttestationKind } from "../objc/authentication-services/enums/as-authorization-public-key-credential-attestation-kind.js";
import { ASAuthorizationPublicKeyCredentialLargeBlobSupportRequirement } from "../objc/authentication-services/enums/as-authorization-public-key-credential-large-blob-support-requirement.js";
import { ASAuthorizationPublicKeyCredentialUserVerificationPreference } from "../objc/authentication-services/enums/as-authorization-public-key-credential-user-verification-preference.js";
import { NSArrayFromObjects } from "../objc/foundation/nsarray.js";
import {
  bufferFromNSDataDirect,
  NSDataFromBuffer,
} from "../objc/foundation/nsdata.js";
import type { _NSError } from "../objc/foundation/nserror.js";
import { NSStringFromString } from "../objc/foundation/nsstring.js";
import {
  removeControllerState,
  setControllerState,
  WebauthnCreateController,
  type PublicKeyCredentialParams,
} from "./authorization-controller.js";
import { parseAttestationObject } from "@oslojs/webauthn";
import { ASAuthorizationPublicKeyCredentialAttachment } from "../objc/authentication-services/enums/as-authorization-public-key-credential-attachment.js";

export interface CreateCredentialResult {
  credentialId: Buffer;
  clientDataJSON: Buffer;
  attestationObject: Buffer;
  authenticatorData: Buffer;
  attachment: AuthenticatorAttachment;
  transports: string[];
  isResidentKey: boolean;
  publicKeyAlgorithm: number;
  publicKey: Buffer;
  isLargeBlobSupported: boolean | null;
  isPRFSupported: boolean | null;
  prfFirst: Buffer | null;
  prfSecond: Buffer | null;
}

type CredentialUserVerificationPreference =
  | "required"
  | "preferred"
  | "discouraged";

type CredentialAttestationPreference =
  | "direct"
  | "enterprise"
  | "indirect"
  | "none";

const VALID_EXTENSIONS = ["largeBlob", "prf"] as const;
export type CredentialCreationExtensions = (typeof VALID_EXTENSIONS)[number];

interface CreateCredentialAdditionalOptions {
  topFrameOrigin?: string;
  userDisplayName?: string;

  // largeBlob extension
  largeBlobSupport?: "required" | "preferred" | "unspecified";

  // prf extension
  prf?: PRFInput;
}

export interface ExcludeCredential {
  id: Buffer;
  transports?: string[];
}

function createCredential(
  rpid: string,
  challenge: Buffer,
  username: string,
  userID: Buffer,
  nativeWindowHandle: Buffer,
  origin: string,
  enabledExtensions: CredentialCreationExtensions[],
  attestation: CredentialAttestationPreference = "none",
  supportedAlgorithmIdentifiers: PublicKeyCredentialParams[],
  excludeCredentials: ExcludeCredential[],
  residentKeyRequired: boolean = false,
  userVerification: CredentialUserVerificationPreference = "preferred",
  additionalOptions: CreateCredentialAdditionalOptions = {}
): Promise<CreateCredentialResult> {
  const { promise, resolve, reject } =
    PromiseWithResolvers<CreateCredentialResult>();

  // Create NS objects
  const NS_rpID = NSStringFromString(rpid);

  // let challenge: Data // Obtain this from the server.
  const NS_challenge = NSDataFromBuffer(challenge);

  const NS_username = NSStringFromString(username);
  const NS_userID = NSDataFromBuffer(userID);

  // let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
  const platformProvider = createPlatformPublicKeyCredentialProvider(NS_rpID);

  // let platformKeyRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)
  const platformKeyRequest =
    platformProvider.createCredentialRegistrationRequestWithChallenge$name$userID$(
      NS_challenge,
      NS_username,
      NS_userID
    );

  // Large Blob Support
  if (enabledExtensions.includes("largeBlob")) {
    let supportMode:
      | ASAuthorizationPublicKeyCredentialLargeBlobSupportRequirement
      | undefined;

    const largeBlobSupport = additionalOptions.largeBlobSupport;
    if (largeBlobSupport === "required") {
      supportMode =
        ASAuthorizationPublicKeyCredentialLargeBlobSupportRequirement.Required;
    } else if (largeBlobSupport === "preferred") {
      supportMode =
        ASAuthorizationPublicKeyCredentialLargeBlobSupportRequirement.Preferred;
    } else {
      console.warn(
        "[electron-webauthn] largeBlobSupport is enabled but largeBlobSupport is not provided, skipping large blob support"
      );
    }

    if (supportMode) {
      const largeBlobInput =
        createASAuthorizationPublicKeyCredentialLargeBlobRegistrationInput(
          supportMode
        );
      platformKeyRequest.setLargeBlob$(largeBlobInput);
    }
  }

  // Attestation Preference
  let attestationPreference: ASAuthorizationPublicKeyCredentialAttestationKind =
    ASAuthorizationPublicKeyCredentialAttestationKind.None;

  // Apple's 'Platform' Passkey Provider does not support attestation.
  // If any of these attestation preferences are set, the request will fail with error 1000.
  // if (attestation === "direct") {
  //   attestationPreference =
  //     ASAuthorizationPublicKeyCredentialAttestationKind.Direct;
  // } else if (attestation === "enterprise") {
  //   attestationPreference =
  //     ASAuthorizationPublicKeyCredentialAttestationKind.Enterprise;
  // } else if (attestation === "indirect") {
  //   attestationPreference =
  //     ASAuthorizationPublicKeyCredentialAttestationKind.Indirect;
  // }

  platformKeyRequest.setAttestationPreference$(
    NSStringFromString(attestationPreference)
  );

  // User Verification Preference
  let userVerificationPreference: ASAuthorizationPublicKeyCredentialUserVerificationPreference =
    ASAuthorizationPublicKeyCredentialUserVerificationPreference.Preferred;
  if (userVerification === "required") {
    userVerificationPreference =
      ASAuthorizationPublicKeyCredentialUserVerificationPreference.Required;
  } else if (userVerification === "discouraged") {
    userVerificationPreference =
      ASAuthorizationPublicKeyCredentialUserVerificationPreference.Discouraged;
  }

  platformKeyRequest.setUserVerificationPreference$(
    NSStringFromString(userVerificationPreference)
  );

  // User Display Name if provided
  if (additionalOptions.userDisplayName) {
    const userDisplayName = NSStringFromString(
      additionalOptions.userDisplayName
    );
    platformKeyRequest.setDisplayName$(userDisplayName);
  }

  // PRF extension
  if (enabledExtensions.includes("prf")) {
    if (additionalOptions.prf) {
      const inputValues = createPRFInput(additionalOptions.prf);
      const prfInput =
        createASAuthorizationPublicKeyCredentialPRFRegistrationInput(
          inputValues
        );
      platformKeyRequest.setPrf$(prfInput);
    } else {
      platformKeyRequest.setPrf$(
        ASAuthorizationPublicKeyCredentialPRFRegistrationInput.checkForSupport()
      );
    }
  }

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArrayFromObjects([platformKeyRequest]);
  const authController: typeof ASAuthorizationController.prototype =
    WebauthnCreateController.alloc().initWithAuthorizationRequests$(
      requestsArray
    );

  // Generate our own client data instead of letting apple generate it
  //  This is because apple's client data lack the `crossOrigin` field, which is required by a lot of sites.
  const clientData = generateWebauthnClientData(
    "webauthn.create",
    origin,
    challenge,
    additionalOptions.topFrameOrigin
  );
  const { clientDataHash, clientDataBuffer } =
    generateClientDataInfo(clientData);

  setControllerState(
    authController,
    clientDataHash,
    supportedAlgorithmIdentifiers,
    residentKeyRequired,
    excludeCredentials
  );

  const finished = (_success: boolean) => {
    removeControllerState(authController);
  };

  // authController.delegate = self
  const delegate = createAuthorizationControllerDelegate({
    didCompleteWithAuthorization: (_, authorization) => {
      // Cast to _ASAuthorization to access typed methods
      const credential =
        authorization.credential() as unknown as _ASAuthorizationPlatformPublicKeyCredentialRegistration;
      console.log("Authorization succeeded:", credential);

      const credentialIdBuffer = bufferFromNSDataDirect(
        credential.credentialID()
      );

      const attestationObjectBuffer = bufferFromNSDataDirect(
        credential.rawAttestationObject()
      );
      const attestation = parseAttestationObject(attestationObjectBuffer);

      const publicKey = attestation.authenticatorData.credential.publicKey;

      // Encode the public key to DER-encoded SubjectPublicKeyInfo (SPKI) format
      const ec2Key = publicKey.ec2();
      const publicKeySPKI = encodeEC2PublicKeyToSPKI(ec2Key.x, ec2Key.y);

      const authenticatorData = Buffer.from(
        JSON.stringify(attestation.authenticatorData)
      );

      let authenticatorAttachment: AuthenticatorAttachment = "platform";
      if (
        credential.attachment() ===
        ASAuthorizationPublicKeyCredentialAttachment.ASAuthorizationPublicKeyCredentialAttachmentCrossPlatform
      ) {
        authenticatorAttachment = "cross-platform";
      }

      let isLargeBlobSupported: boolean | null = null;
      if (enabledExtensions.includes("largeBlob")) {
        const largeBlobOutput = credential.largeBlob();
        if (largeBlobOutput) {
          isLargeBlobSupported = largeBlobOutput.isSupported();
        }
      }

      let prfFirst: Buffer | null = null;
      let prfSecond: Buffer | null = null;
      let isPRFSupported: boolean | null = null;
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

          isPRFSupported = prfOutput.isSupported();
        }
      }

      const data: CreateCredentialResult = {
        credentialId: credentialIdBuffer,
        clientDataJSON: clientDataBuffer,
        attestationObject: attestationObjectBuffer,
        authenticatorData,
        attachment: authenticatorAttachment,
        transports: ["hybrid", "internal"],
        isResidentKey: true,
        publicKeyAlgorithm: publicKey.algorithm(),
        publicKey: publicKeySPKI,
        isLargeBlobSupported,
        isPRFSupported,
        prfFirst,
        prfSecond,
      };
      resolve(data);

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
  const presentationContextProvider =
    createPresentationContextProviderFromNativeWindowHandle(nativeWindowHandle);
  authController.setPresentationContextProvider$(presentationContextProvider);

  // authController.performRequests()
  authController.performRequests();

  // TODO
  // https://source.chromium.org/chromium/chromium/src/+/main:device/fido/mac/icloud_keychain_sys.mm;l=317;drc=7cac9cac0b4037c8b9b9d95d7e260c1bc348594c?q=userVerificationPreference&ss=chromium/chromium/src

  return promise;
}

export { createCredential };
