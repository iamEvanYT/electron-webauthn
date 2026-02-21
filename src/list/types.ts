export interface PasskeyCredential {
  /** Base64-encoded credential ID */
  id: string;
  /** The relying party identifier (e.g., "example.com") */
  rpId: string;
  /** The user name */
  userName: string;
  /** Base64-encoded user handle */
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
