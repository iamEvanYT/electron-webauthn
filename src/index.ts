import type {
  CreateCredentialResult,
  GetCredentialResult,
  ListPasskeysOptions,
  ListPasskeysError,
  ListPasskeysResult,
  PasskeyAuthorizationError,
  PasskeyAuthorizationResult,
  WebauthnCreateRequestOptions,
  WebauthnGetRequestOptions,
  WebauthnModule,
} from "@electron-webauthn/types";

export type {
  CreateCredentialErrorCodes,
  CreateCredentialResult,
  CreateCredentialSuccessData,
  CreateCredentialSuccessResult,
  CreateCredentialErrorResult,
  GetCredentialErrorCodes,
  GetCredentialResult,
  GetCredentialSuccessData,
  GetCredentialSuccessResult,
  GetCredentialErrorResult,
  ListPasskeysOptions,
  ListPasskeysError,
  ListPasskeysResult,
  PasskeyAuthorizationError,
  PasskeyAuthorizationResult,
  PasskeyAuthorizationStatus,
  PasskeyCredential,
  WebauthnCreateRequestOptions,
  WebauthnGetRequestOptions,
  WebauthnModule,
} from "@electron-webauthn/types";

const unsupportedGetResult: GetCredentialResult = {
  success: false,
  error: "NotAllowedError",
  errorObject: new Error(
    "electron-webauthn is only available on macOS. Install @electron-webauthn/macos on Darwin hosts."
  ),
};

const unsupportedCreateResult: CreateCredentialResult = {
  success: false,
  error: "NotAllowedError",
  errorObject: new Error(
    "electron-webauthn is only available on macOS. Install @electron-webauthn/macos on Darwin hosts."
  ),
};

const unsupportedListResult: ListPasskeysError = {
  success: false,
  error: new Error(
    "electron-webauthn is only available on macOS. Install @electron-webauthn/macos on Darwin hosts."
  ),
};

const unsupportedPasskeyAuthorizationResult: PasskeyAuthorizationError = {
  success: false,
  error: new Error(
    "electron-webauthn is only available on macOS. Install @electron-webauthn/macos on Darwin hosts."
  ),
};

let moduleCache: WebauthnModule | null = null;
let modulePromise: Promise<WebauthnModule | null> | null = null;
let platformOverride: NodeJS.Platform | null = null;

type MacosLoader = () => Promise<WebauthnModule>;
const defaultLoader: MacosLoader = () => import("@electron-webauthn/macos");
let macosLoader: MacosLoader = defaultLoader;

function runtimePlatform() {
  return platformOverride ?? process.platform;
}

async function getMacosModule(): Promise<WebauthnModule | null> {
  if (runtimePlatform() !== "darwin") {
    return null;
  }

  if (moduleCache) {
    return moduleCache;
  }

  if (modulePromise) {
    return modulePromise;
  }

  modulePromise = (async () => {
    try {
      const module = await macosLoader();
      moduleCache = module;
      return module;
    } catch {
      return null;
    } finally {
      modulePromise = null;
    }
  })();

  return modulePromise;
}

export async function createCredential(
  publicKeyOptions: PublicKeyCredentialCreationOptions | undefined,
  additionalOptions: WebauthnCreateRequestOptions
): Promise<CreateCredentialResult> {
  const module = await getMacosModule();
  if (!module) {
    return unsupportedCreateResult;
  }

  return module.createCredential(publicKeyOptions, additionalOptions);
}

export async function getCredential(
  publicKeyOptions: PublicKeyCredentialRequestOptions | undefined,
  additionalOptions: WebauthnGetRequestOptions
): Promise<GetCredentialResult> {
  const module = await getMacosModule();
  if (!module) {
    return unsupportedGetResult;
  }

  return module.getCredential(publicKeyOptions, additionalOptions);
}

export async function getListPasskeyAuthorizationStatus(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  const module = await getMacosModule();
  if (!module) {
    return unsupportedPasskeyAuthorizationResult;
  }

  return module.getListPasskeyAuthorizationStatus();
}

export async function requestListPasskeyAuthorization(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  const module = await getMacosModule();
  if (!module) {
    return unsupportedPasskeyAuthorizationResult;
  }

  return module.requestListPasskeyAuthorization();
}

export async function listPasskeys(
  relyingPartyId: string,
  options?: ListPasskeysOptions
): Promise<ListPasskeysResult | ListPasskeysError> {
  const module = await getMacosModule();
  if (!module) {
    return unsupportedListResult;
  }

  return module.listPasskeys(relyingPartyId, options);
}

export function __setMacosLoaderForTesting(loader: MacosLoader | null) {
  macosLoader = loader ?? defaultLoader;
  moduleCache = null;
  modulePromise = null;
}

export function __setPlatformForTesting(platform: NodeJS.Platform | null) {
  platformOverride = platform;
  moduleCache = null;
  modulePromise = null;
}
