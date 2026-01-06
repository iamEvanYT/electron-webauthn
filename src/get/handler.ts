import { bufferSourceToBuffer, bufferToBase64Url } from "../helpers/index.js";
import type { PRFInput } from "../helpers/prf.js";
import { isRpIdAllowedForOrigin } from "../helpers/rpid.js";
import { isNumber, isString } from "../helpers/validation.js";
import {
  getCredentialInternal,
  type CredentialAssertionExtensions,
} from "./internal-handler.js";

/**
 * The result of getting a credential.
 */
export interface GetCredentialSuccessData {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
  extensions?: {
    prf?: {
      results?: {
        first: string; // b64 encoded
        second?: string; // b64 encoded
      };
    };
    largeBlob?: {
      blob?: string; // b64 encoded
      written?: boolean;
    };
  };
}

interface WebauthnGetRequestOptions {
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

interface GetCredentialSuccessResult {
  success: true;
  data: GetCredentialSuccessData;
}
interface GetCredentialErrorResult {
  success: false;
  error: "TypeError" | "AbortError" | "NotAllowedError" | "SecurityError";
}
export type GetCredentialResult =
  | GetCredentialSuccessResult
  | GetCredentialErrorResult;

interface ExtensionsConfigurationResult {
  extensions: CredentialAssertionExtensions[];

  // largeBlob extension
  largeBlobWriteBuffer?: Buffer;

  // prf extension
  prf?: PRFInput;
  prfByCredential?: Record<string, PRFInput>;
}
function getExtensionsConfiguration(
  extensionsData: AuthenticationExtensionsClientInputs | undefined
): ExtensionsConfigurationResult {
  if (!(extensionsData && typeof extensionsData === "object")) {
    return {
      extensions: [],
    };
  }

  const extensions: CredentialAssertionExtensions[] = [];

  // largeBlob extension
  let largeBlobWriteBuffer: Buffer | undefined;
  if (extensionsData.largeBlob) {
    const largeBlobConfig = extensionsData.largeBlob;
    if (largeBlobConfig.read) {
      extensions.push("largeBlobRead");
    }
    if (largeBlobConfig.write) {
      extensions.push("largeBlobWrite");
      largeBlobWriteBuffer = bufferSourceToBuffer(largeBlobConfig.write);
    }
  }

  // prf extension
  let prf: PRFInput | undefined;
  let prfByCredential: Record<string, PRFInput> | undefined;

  const prfExtension = extensionsData.prf;
  if (prfExtension && (prfExtension.eval || prfExtension.evalByCredential)) {
    extensions.push("prf");

    if (prfExtension.eval) {
      prf = {
        first: bufferSourceToBuffer(prfExtension.eval.first),
        second: prfExtension.eval.second
          ? bufferSourceToBuffer(prfExtension.eval.second)
          : undefined,
      };
    }

    if (prfExtension.evalByCredential) {
      prfByCredential = {};
      for (const [credId, value] of Object.entries(
        prfExtension.evalByCredential
      )) {
        prfByCredential[credId] = {
          first: bufferSourceToBuffer(value.first),
          second: value.second ? bufferSourceToBuffer(value.second) : undefined,
        };
      }
    }
  }

  return {
    extensions,
    largeBlobWriteBuffer,
    prf,
    prfByCredential,
  };
}

export async function getCredential(
  publicKeyOptions: PublicKeyCredentialRequestOptions | undefined,
  additionalOptions: WebauthnGetRequestOptions
): Promise<GetCredentialResult> {
  // Check all the arguments
  if (!publicKeyOptions) {
    return null;
  }

  const rpId = publicKeyOptions.rpId;
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

  const userVerification = publicKeyOptions.userVerification;
  if (userVerification && !isString(userVerification)) {
    return { success: false, error: "TypeError" };
  }

  const allowedCredentialsArray: Buffer[] = [];
  const allowedCredentials = publicKeyOptions.allowCredentials;
  if (allowedCredentials && Array.isArray(allowedCredentials)) {
    for (const allowedCredential of allowedCredentials) {
      if (!(allowedCredential && typeof allowedCredential === "object"))
        continue;
      if (allowedCredential.type !== "public-key") continue;
      const id = bufferSourceToBuffer(allowedCredential.id);
      if (!id) continue;
      allowedCredentialsArray.push(id);
    }
  }

  const {
    extensions: enabledExtensions,
    largeBlobWriteBuffer,
    prf,
    prfByCredential,
  } = getExtensionsConfiguration(publicKeyOptions.extensions);

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
  const result = await getCredentialInternal(
    rpId,
    challenge,
    nativeWindowHandle,
    currentOrigin,
    enabledExtensions,
    allowedCredentialsArray,
    userVerification,
    {
      topFrameOrigin,
      largeBlobDataToWrite: largeBlobWriteBuffer,
      prf,
      prfByCredential,
    }
  ).catch((error: Error) => {
    console.error("Error getting credential", error);
    if (error.message.startsWith("The operation couldn’t be completed.")) {
      return "NotAllowedError";
    }
    return "NotAllowedError";
  });

  // Handle the result
  if (typeof result === "string") {
    if (result === "NotAllowedError") {
      return { success: false, error: "NotAllowedError" };
    }
    return { success: false, error: "NotAllowedError" };
  }

  const data: GetCredentialSuccessData = {
    credentialId: bufferToBase64Url(result.id),
    clientDataJSON: bufferToBase64Url(result.clientDataJSON),
    authenticatorData: bufferToBase64Url(result.authenticatorData),
    signature: bufferToBase64Url(result.signature),
    userHandle: bufferToBase64Url(result.userHandle),
    extensions: {},
  };

  // Add PRF extension results if available
  if (result.prf && (result.prf[0] || result.prf[1])) {
    data.extensions!.prf = {
      results: {
        first: bufferToBase64Url(result.prf[0]!),
        second: result.prf[1] ? bufferToBase64Url(result.prf[1]) : undefined,
      },
    };
  }

  // Add largeBlob extension results if available
  if (result.largeBlob || result.largeBlobWritten) {
    data.extensions!.largeBlob = {
      blob: result.largeBlob ? bufferToBase64Url(result.largeBlob) : undefined,
      written:
        result.largeBlobWritten !== null ? result.largeBlobWritten : undefined,
    };
  }

  return { success: true, data };
}
