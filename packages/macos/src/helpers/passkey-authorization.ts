import type {
  PasskeyAuthorizationError,
  PasskeyAuthorizationResult,
  PasskeyAuthorizationStatus,
} from "@electron-webauthn/types";
import {
  ASAuthorizationWebBrowserPublicKeyCredentialManager,
  ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState,
  type _ASAuthorizationWebBrowserPublicKeyCredentialManager,
} from "objcjs-types/AuthenticationServices";
import { requestAuthorizationForPublicKeyCredentials$Block } from "objcjs-types/AuthenticationServices/blocks";

export interface ResolvePasskeyAuthorizationOptions {
  requestIfNeeded: boolean;
  manager?: _ASAuthorizationWebBrowserPublicKeyCredentialManager;
}

type PasskeyAuthorizationManagerFactory =
  () => _ASAuthorizationWebBrowserPublicKeyCredentialManager;

function defaultPasskeyAuthorizationManagerFactory() {
  return ASAuthorizationWebBrowserPublicKeyCredentialManager.alloc().init();
}

let passkeyAuthorizationManagerFactory: PasskeyAuthorizationManagerFactory =
  defaultPasskeyAuthorizationManagerFactory;

export function createPasskeyAuthorizationManager() {
  return passkeyAuthorizationManagerFactory();
}

function normalizeAuthorizationStatus(
  rawState: number
): PasskeyAuthorizationStatus {
  switch (rawState) {
    case ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState.Authorized:
      return "authorized";
    case ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState.Denied:
      return "denied";
    case ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState.NotDetermined:
      return "notDetermined";
    default:
      throw new Error(`Unknown passkey authorization state: ${rawState}`);
  }
}

async function requestAuthorization(
  manager: _ASAuthorizationWebBrowserPublicKeyCredentialManager
): Promise<PasskeyAuthorizationStatus> {
  const rawState = await new Promise<number>((resolve) => {
    const block = requestAuthorizationForPublicKeyCredentials$Block(
      (nextState) => {
        resolve(nextState);
      }
    );
    manager.requestAuthorizationForPublicKeyCredentials$(block);
  });

  return normalizeAuthorizationStatus(rawState);
}

export async function resolvePasskeyAuthorization({
  requestIfNeeded,
  manager,
}: ResolvePasskeyAuthorizationOptions): Promise<PasskeyAuthorizationStatus> {
  const authorizationManager = manager ?? createPasskeyAuthorizationManager();
  const currentStatus = normalizeAuthorizationStatus(
    authorizationManager.authorizationStateForPlatformCredentials() as number
  );

  if (currentStatus !== "notDetermined" || !requestIfNeeded) {
    return currentStatus;
  }

  return requestAuthorization(authorizationManager);
}

function normalizeAuthorizationError(
  error: unknown
): PasskeyAuthorizationError {
  return {
    success: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

export async function getListPasskeyAuthorizationStatus(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  try {
    return {
      success: true,
      status: await resolvePasskeyAuthorization({ requestIfNeeded: false }),
    };
  } catch (error) {
    return normalizeAuthorizationError(error);
  }
}

export async function requestListPasskeyAuthorization(): Promise<
  PasskeyAuthorizationResult | PasskeyAuthorizationError
> {
  try {
    return {
      success: true,
      status: await resolvePasskeyAuthorization({ requestIfNeeded: true }),
    };
  } catch (error) {
    return normalizeAuthorizationError(error);
  }
}

export function __setPasskeyAuthorizationManagerFactoryForTesting(
  factory: PasskeyAuthorizationManagerFactory | null
) {
  passkeyAuthorizationManagerFactory =
    factory ?? defaultPasskeyAuthorizationManagerFactory;
}
