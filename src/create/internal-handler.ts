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
import type { NobjcObject } from "objc-js";
import { createSecurityKeyPublicKeyCredentialProvider } from "../objc/authentication-services/as-authorization-security-key-public-key-credential-provider.js";
import {
  createASAuthorizationPublicKeyCredentialParameters,
  type _ASAuthorizationPublicKeyCredentialParameters,
} from "../objc/authentication-services/as-authorization-public-key-credential-parameters.js";

export type AuthenticatorAttachmentWithExtra = AuthenticatorAttachment | "all";

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

export type LargeBlobSupport = "required" | "preferred" | "unspecified";

interface CreateCredentialAdditionalOptions {
  topFrameOrigin?: string;
  userDisplayName?: string;

  // largeBlob extension
  largeBlobSupport?: LargeBlobSupport;

  // prf extension
  prf?: PRFInput;
}

export interface ExcludeCredential {
  id: Buffer;
  transports?: string[];
}

function setupPublicKeyCredentialRegistrationRequest(
  type: "platform" | "security-key",
  keyRequest: NobjcObject,
  attestation: CredentialAttestationPreference,
  enabledExtensions: CredentialCreationExtensions[],
  userVerification: CredentialUserVerificationPreference,
  pubKeyCredParams: PublicKeyCredentialParams[],
  additionalOptions: CreateCredentialAdditionalOptions
) {
  // Large Blob Support
  if (type === "platform" && enabledExtensions.includes("largeBlob")) {
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
      keyRequest.setLargeBlob$(largeBlobInput);
    }
  }

  // Attestation Preference
  let attestationPreference: ASAuthorizationPublicKeyCredentialAttestationKind =
    ASAuthorizationPublicKeyCredentialAttestationKind.None;

  // Apple's 'Platform' Passkey Provider does not support attestation.
  // Only 'Security Key' Passkey Provider supports attestation.
  // If any of these attestation preferences are set, the request will fail with error 1000.
  if (type === "security-key") {
    if (attestation === "direct") {
      attestationPreference =
        ASAuthorizationPublicKeyCredentialAttestationKind.Direct;
    } else if (attestation === "enterprise") {
      attestationPreference =
        ASAuthorizationPublicKeyCredentialAttestationKind.Enterprise;
    } else if (attestation === "indirect") {
      attestationPreference =
        ASAuthorizationPublicKeyCredentialAttestationKind.Indirect;
    }
  }

  keyRequest.setAttestationPreference$(
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

  keyRequest.setUserVerificationPreference$(
    NSStringFromString(userVerificationPreference)
  );

  // User Display Name if provided
  if (type === "platform" && additionalOptions.userDisplayName) {
    const userDisplayName = NSStringFromString(
      additionalOptions.userDisplayName
    );
    keyRequest.setDisplayName$(userDisplayName);
  }

  // Credential Parameters
  if (type === "security-key") {
    const credentialParameters: _ASAuthorizationPublicKeyCredentialParameters[] =
      [];
    for (const param of pubKeyCredParams) {
      if (param.type === "public-key") {
        credentialParameters.push(
          createASAuthorizationPublicKeyCredentialParameters(param.algorithm)
        );
      }
    }
    const nsCredentialParameters = NSArrayFromObjects(credentialParameters);
    keyRequest.setCredentialParameters$(nsCredentialParameters);
  }

  // PRF extension
  if (type === "platform" && enabledExtensions.includes("prf")) {
    if (additionalOptions.prf) {
      const inputValues = createPRFInput(additionalOptions.prf);
      const prfInput =
        createASAuthorizationPublicKeyCredentialPRFRegistrationInput(
          inputValues
        );
      keyRequest.setPrf$(prfInput);
    } else {
      keyRequest.setPrf$(
        ASAuthorizationPublicKeyCredentialPRFRegistrationInput.checkForSupport()
      );
    }
  }
}

function createCredentialInternal(
  rpid: string,
  challenge: Buffer,
  username: string,
  userID: Buffer,
  nativeWindowHandle: Buffer,
  origin: string,
  timeout: number,
  enabledExtensions: CredentialCreationExtensions[],
  attestation: CredentialAttestationPreference = "none",
  supportedAlgorithmIdentifiers: PublicKeyCredentialParams[] = [],
  excludeCredentials: ExcludeCredential[],
  residentKeyRequired: boolean = false,
  preferredAuthenticatorAttachment: AuthenticatorAttachmentWithExtra = "all",
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

  const requestArrayInput: NobjcObject[] = [];

  if (
    preferredAuthenticatorAttachment === "all" ||
    preferredAuthenticatorAttachment === "platform"
  ) {
    // let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
    const platformProvider = createPlatformPublicKeyCredentialProvider(NS_rpID);

    // let platformKeyRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)
    const platformKeyRequest =
      platformProvider.createCredentialRegistrationRequestWithChallenge$name$userID$(
        NS_challenge,
        NS_username,
        NS_userID
      );

    setupPublicKeyCredentialRegistrationRequest(
      "platform",
      platformKeyRequest,
      attestation,
      enabledExtensions,
      userVerification,
      supportedAlgorithmIdentifiers,
      additionalOptions
    );

    requestArrayInput.push(platformKeyRequest);
  }

  if (
    preferredAuthenticatorAttachment === "all" ||
    preferredAuthenticatorAttachment === "cross-platform"
  ) {
    // let securityKeyProvider = ASAuthorizationSecurityKeyPublicKeyCredentialProvider(relyingPartyIdentifier: "example.com")
    const securityKeyProvider =
      createSecurityKeyPublicKeyCredentialProvider(NS_rpID);

    // let securityKeyRequest = securityKeyProvider.createCredentialAssertionRequest(challenge: challenge)
    const securityKeyRequest =
      securityKeyProvider.createCredentialRegistrationRequestWithChallenge$displayName$name$userID$(
        NS_challenge,
        NSStringFromString(additionalOptions.userDisplayName || username),
        NS_username,
        NS_userID
      );

    setupPublicKeyCredentialRegistrationRequest(
      "security-key",
      securityKeyRequest,
      attestation,
      enabledExtensions,
      userVerification,
      supportedAlgorithmIdentifiers,
      additionalOptions
    );

    requestArrayInput.push(securityKeyRequest);
  }

  // let authController = ASAuthorizationController(authorizationRequests: [platformKeyRequest])
  const requestsArray = NSArrayFromObjects(requestArrayInput);
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

  let isFinished = false;
  let timeoutHandlerId: NodeJS.Timeout | null = null;
  const finished = (_success: boolean) => {
    isFinished = true;
    removeControllerState(authController);

    if (timeoutHandlerId) {
      clearTimeout(timeoutHandlerId);
      timeoutHandlerId = null;
    }
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
      // console.error("Authorization failed:", errorMessage);

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

  // Cancelling auth controller on timeout
  timeoutHandlerId = setTimeout(() => {
    if (isFinished) return;
    authController.cancel();
  }, timeout);

  return promise;
}

export { createCredentialInternal };
