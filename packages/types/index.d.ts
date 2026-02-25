export type GetCredentialErrorCodes =
  | "TypeError"
  | "AbortError"
  | "NotAllowedError"
  | "SecurityError";

export interface GetCredentialSuccessData {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
  extensions?: {
    prf?: {
      results?: {
        first: string;
        second?: string;
      };
    };
    largeBlob?: {
      blob?: string;
      written?: boolean;
    };
  };
}

export interface GetCredentialSuccessResult {
  success: true;
  data: GetCredentialSuccessData;
}

export interface GetCredentialErrorResult {
  success: false;
  error: GetCredentialErrorCodes;
  errorObject?: Error;
}

export type GetCredentialResult =
  | GetCredentialSuccessResult
  | GetCredentialErrorResult;

export type CreateCredentialErrorCodes =
  | "TypeError"
  | "AbortError"
  | "NotAllowedError"
  | "SecurityError"
  | "InvalidStateError";

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
        first?: string;
        second?: string;
      };
    };
    largeBlob?: {
      supported?: boolean;
    };
  };
}

export interface CreateCredentialSuccessResult {
  success: true;
  data: CreateCredentialSuccessData;
}

export interface CreateCredentialErrorResult {
  success: false;
  error: CreateCredentialErrorCodes;
  errorObject?: Error;
}

export type CreateCredentialResult =
  | CreateCredentialSuccessResult
  | CreateCredentialErrorResult;

export interface PasskeyCredential {
  id: string;
  rpId: string;
  userName: string;
  userHandle: string;
}

export interface ListPasskeysResult {
  success: true;
  credentials: PasskeyCredential[];
}

export interface ListPasskeysError {
  success: false;
  error: Error;
}

export interface WebauthnGetRequestOptions {
  currentOrigin: string;
  topFrameOrigin: string | undefined;
  isPublicSuffix?: (domain: string) => boolean;
  nativeWindowHandle: Buffer;
}

export interface WebauthnCreateRequestOptions {
  currentOrigin: string;
  topFrameOrigin: string | undefined;
  isPublicSuffix?: (domain: string) => boolean;
  nativeWindowHandle: Buffer;
}

export interface WebauthnModule {
  createCredential(
    publicKeyOptions: PublicKeyCredentialCreationOptions | undefined,
    additionalOptions: WebauthnCreateRequestOptions
  ): Promise<CreateCredentialResult>;
  getCredential(
    publicKeyOptions: PublicKeyCredentialRequestOptions | undefined,
    additionalOptions: WebauthnGetRequestOptions
  ): Promise<GetCredentialResult>;
  listPasskeys(
    relyingPartyId: string
  ): Promise<ListPasskeysResult | ListPasskeysError>;
}
