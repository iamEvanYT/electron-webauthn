import type { UserVerificationPreference } from "../get/internal-handler.js";
import { bufferSourceToBuffer, bufferToBase64Url } from "../helpers/index.js";
import type { PRFInput } from "../helpers/prf.js";
import { isRpIdAllowedForOrigin } from "../helpers/rpid.js";
import { isNumber, isObject, isString } from "../helpers/validation.js";
import type { PublicKeyCredentialParams } from "./authorization-controller.js";
import {
  createCredentialInternal,
  type CredentialCreationExtensions,
  type ExcludeCredential,
  type LargeBlobSupport,
} from "./internal-handler.js";

/**
 * The result of getting a credential.
 */
export interface CreateCredentialSuccessData {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  authData: string;
  publicKey: string;
  publicKeyAlgorithm: number;
  transports: string[];
  extensions: {
    credProps?: {
      rk: boolean;
    };
    prf?: {
      enabled?: boolean;
      results: {
        first?: string; // b64 encoded
        second?: string; // b64 encoded
      };
    };
    largeBlob?: {
      supported?: boolean;
    };
  };
}

interface WebauthnCreateRequestOptions {
  // Origins //

  /**
   * The origin of the requesting document.
   */
  currentOrigin: string;

  /**
   * The origin of the top frame document.
   *
   * If the requesting document is an iframe, this should be the origin of the top frame document.
   * If not, it should be left blank.
   */
  topFrameOrigin: string | undefined;

  // Public Suffix check //

  /**
   * Return true if the input is a public suffix (eTLD), e.g. "com", "co.uk".
   *
   * Strongly recommended to implement using PSL (e.g. tldts).
   */
  isPublicSuffix?: (domain: string) => boolean;

  // Others //

  /**
   * Can be found in Electron with `BrowserWindow.getNativeWindowHandle()`.
   *
   * Otherwise, this is the pointer to a NSView object.
   */
  nativeWindowHandle: Buffer;
}

interface CreateCredentialSuccessResult {
  success: true;
  data: CreateCredentialSuccessData;
}
interface CreateCredentialErrorResult {
  success: false;
  error:
    | "TypeError"
    | "AbortError"
    | "NotAllowedError"
    | "SecurityError"
    | "InvalidStateError";
}
export type CreateCredentialResult =
  | CreateCredentialSuccessResult
  | CreateCredentialErrorResult;

interface ExtensionsConfigurationResult {
  extensions: CredentialCreationExtensions[];

  // largeBlob extension
  largeBlobSupport?: LargeBlobSupport;

  // prf extension
  prf?: PRFInput;
}
function getExtensionsConfiguration(
  extensionsData: AuthenticationExtensionsClientInputs | undefined
): ExtensionsConfigurationResult {
  if (!(extensionsData && typeof extensionsData === "object")) {
    return {
      extensions: [],
    };
  }

  const extensions: CredentialCreationExtensions[] = [];

  // largeBlob extension
  let largeBlobSupport: LargeBlobSupport | undefined;
  if (isObject(extensionsData.largeBlob)) {
    extensions.push("largeBlob");
    const largeBlobConfig = extensionsData.largeBlob;
    if (largeBlobConfig.support === "required") {
      largeBlobSupport = "required";
    } else if (largeBlobConfig.support === "preferred") {
      largeBlobSupport = "preferred";
    }
  }

  // prf extension
  let prf: PRFInput | undefined;
  if (isObject(extensionsData.prf)) {
    const prfEval = extensionsData.prf.eval;
    if (prfEval) {
      const first = bufferSourceToBuffer(prfEval.first);
      const second = bufferSourceToBuffer(prfEval.second);
      if (first) {
        prf = {
          first: first ? first : null,
          second: second ? second : undefined,
        };
      } else {
        console.warn(
          "[electron-webauthn] prf is enabled but prf.first is not valid, skipping PRF evaluation"
        );
      }
    }
  }

  return {
    extensions,
    largeBlobSupport,
    prf,
  };
}

export async function createCredential(
  publicKeyOptions: PublicKeyCredentialCreationOptions | undefined,
  additionalOptions: WebauthnCreateRequestOptions
): Promise<CreateCredentialResult> {
  // Check all the arguments
  if (!publicKeyOptions) {
    return null;
  }

  const rpInfo = publicKeyOptions.rp;
  if (!isObject(rpInfo)) {
    return { success: false, error: "TypeError" };
  }
  let rpId = rpInfo.id;
  if (!rpId) {
    try {
      const url = new URL(additionalOptions.currentOrigin);
      rpId = url.hostname;
    } catch {}
  }
  if (!isString(rpId)) {
    return { success: false, error: "TypeError" };
  }

  let timeout = publicKeyOptions.timeout;
  if (!isNumber(timeout) || timeout <= 0) {
    // 1 hour (max timeout)
    timeout = 10 * 60 * 1000; // 10 minutes (default timeout)
  } else if (timeout > 60 * 60 * 1000) {
    // 1 hour (max timeout)
    timeout = 60 * 60 * 1000;
  }
  // TODO: Handle timeout

  const challenge = bufferSourceToBuffer(publicKeyOptions.challenge);
  if (!challenge) {
    return { success: false, error: "TypeError" };
  }

  if (!isObject(publicKeyOptions.user)) {
    return { success: false, error: "TypeError" };
  }
  const userName = publicKeyOptions.user.name;
  const userDisplayName = publicKeyOptions.user.displayName;
  if (!isString(userName) || !isString(userDisplayName)) {
    return { success: false, error: "TypeError" };
  }
  const userID = bufferSourceToBuffer(publicKeyOptions.user.id);
  if (!userID) {
    return { success: false, error: "TypeError" };
  }

  const attestationPreference = publicKeyOptions.attestation;
  if (attestationPreference && !isString(attestationPreference)) {
    return { success: false, error: "TypeError" };
  }

  const pubKeyCredParams = publicKeyOptions.pubKeyCredParams;
  const supportedAlgorithmIdentifiers: PublicKeyCredentialParams[] = [];
  if (pubKeyCredParams) {
    if (Array.isArray(pubKeyCredParams)) {
      for (const param of pubKeyCredParams) {
        if (!isObject(param)) continue;
        if (!isNumber(param.alg)) continue;
        supportedAlgorithmIdentifiers.push({
          type: "public-key",
          algorithm: param.alg,
        });
      }
    } else {
      return { success: false, error: "TypeError" };
    }
  }

  const excludeCredentials: ExcludeCredential[] = [];
  if (
    publicKeyOptions.excludeCredentials &&
    Array.isArray(publicKeyOptions.excludeCredentials)
  ) {
    for (const excludeCredential of publicKeyOptions.excludeCredentials) {
      if (!isObject(excludeCredential)) continue;
      if (excludeCredential.type !== "public-key") continue;
      const idBuffer = bufferSourceToBuffer(excludeCredential.id);
      if (!idBuffer) continue;
      excludeCredentials.push({
        id: idBuffer,
        transports: excludeCredential.transports,
      });
    }
  }

  const { extensions, largeBlobSupport, prf } = getExtensionsConfiguration(
    publicKeyOptions.extensions
  );

  let residentKeyRequired = false;
  let userVerificationPreference: UserVerificationPreference = "preferred";
  let preferredAuthenticatorAttachment: AuthenticatorAttachment = "platform";
  if (publicKeyOptions.authenticatorSelection) {
    if (publicKeyOptions.authenticatorSelection.residentKey === "required") {
      residentKeyRequired = true;
    } else if (publicKeyOptions.authenticatorSelection.requireResidentKey) {
      residentKeyRequired = true;
    }

    const userVerifyParam =
      publicKeyOptions.authenticatorSelection.userVerification;
    if (userVerifyParam === "required") {
      userVerificationPreference = "required";
    } else if (userVerifyParam === "discouraged") {
      userVerificationPreference = "discouraged";
    } else {
      userVerificationPreference = "preferred";
    }

    const attachment =
      publicKeyOptions.authenticatorSelection.authenticatorAttachment;
    if (attachment === "cross-platform") {
      preferredAuthenticatorAttachment = "cross-platform";
    }
  }

  // Validate environment
  const { currentOrigin, topFrameOrigin, isPublicSuffix, nativeWindowHandle } =
    additionalOptions;
  const isRpIdAllowed = isRpIdAllowedForOrigin(currentOrigin, rpId, {
    isPublicSuffix,
  });
  if (!isRpIdAllowed.ok) {
    return { success: false, error: "NotAllowedError" };
  }

  // Call the (kinda-native?) handler
  const result = await createCredentialInternal(
    rpId,
    challenge,
    userName,
    userID,
    nativeWindowHandle,
    currentOrigin,
    timeout,
    extensions,
    attestationPreference,
    supportedAlgorithmIdentifiers,
    excludeCredentials,
    residentKeyRequired,
    preferredAuthenticatorAttachment,
    userVerificationPreference,
    {
      topFrameOrigin,
      largeBlobSupport,
      prf,
    }
  ).catch((error: Error) => {
    console.error("Error creating credential", error);
    console.log("error.message", error.message);
    if (
      error.message.includes(
        "(com.apple.AuthenticationServices.AuthorizationError error 1006.)"
      )
    ) {
      // MatchedExcludedCredential
      return "InvalidStateError";
    }
    if (error.message.startsWith("The operation couldn’t be completed.")) {
      return "NotAllowedError";
    }
    return null;
  });

  if (typeof result === "string") {
    return { success: false, error: result };
  }

  const data: CreateCredentialSuccessData = {
    credentialId: bufferToBase64Url(result.credentialId),
    clientDataJSON: bufferToBase64Url(result.clientDataJSON),
    attestationObject: bufferToBase64Url(result.attestationObject),
    authData: bufferToBase64Url(result.authenticatorData),
    publicKey: bufferToBase64Url(result.publicKey),
    publicKeyAlgorithm: result.publicKeyAlgorithm,
    transports: result.transports,
    extensions: {},
  };

  // credProps extension
  if (publicKeyOptions.extensions?.credProps) {
    data.extensions.credProps = {
      rk: result.isResidentKey,
    };
  }

  // largeBlob extension
  if (result.isLargeBlobSupported !== null) {
    data.extensions.largeBlob = {
      supported: result.isLargeBlobSupported,
    };
  }

  // prf extension
  if (result.isPRFSupported !== null) {
    const prfFirst = result.prfFirst;
    const prfSecond = result.prfSecond;

    data.extensions.prf = {
      enabled: result.isPRFSupported,
      results: {
        first: prfFirst ? bufferToBase64Url(prfFirst) : undefined,
        second: prfSecond ? bufferToBase64Url(prfSecond) : undefined,
      },
    };
  }

  return { success: true, data };
}
