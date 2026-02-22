# API Reference

## `createCredential(publicKeyOptions, additionalOptions)`

Creates and registers a new WebAuthn credential using available platform and cross-platform authenticators.

**Note:** You can plug any `publicKeyOptions` from the standard `navigator.credentials.create({ publicKey: ... })` directly into this function.

### Parameters

#### `publicKeyOptions: PublicKeyCredentialCreationOptions`

Standard W3C WebAuthn credential creation options. See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions) for more details.

#### `additionalOptions: WebauthnCreateRequestOptions`

Additional options specific to the Electron environment:

- **`currentOrigin: string`** (required) - The origin of the requesting document (e.g., "https://example.com")
- **`topFrameOrigin: string | undefined`** - The origin of the top frame (for iframe support). Set to `currentOrigin` if not in an iframe
- **`nativeWindowHandle: Buffer`** (required) - Native window handle from `BrowserWindow.getNativeWindowHandle()`, or a pointer to a NSView object
- **`isPublicSuffix?: (domain: string) => boolean`** - Optional function to check if a domain is a public suffix (e.g., "com", "co.uk"). Strongly recommended for security

### Returns

`Promise<CreateCredentialResult>` - Resolves with the registration result (that you can transform into a `PublicKeyCredential` object) or error

### Result Types

```typescript
type CreateCredentialResult =
  | CreateCredentialSuccessResult
  | CreateCredentialErrorResult;

interface CreateCredentialSuccessResult {
  success: true;
  data: {
    credentialId: string; // Base64url-encoded credential ID
    clientDataJSON: string; // Base64url-encoded client data
    attestationObject: string; // Base64url-encoded attestation object
    authData: string; // Base64url-encoded authenticator data
    publicKey: string; // Base64url-encoded public key (COSE format)
    publicKeyAlgorithm: number; // COSE algorithm identifier (e.g., -7 for ES256)
    transports: string[]; // Available transports (e.g., ["internal", "usb"])
    extensions: {
      credProps?: {
        rk: boolean; // True if credential is a resident key
      };
      prf?: {
        enabled?: boolean; // True if PRF is supported
        results?: {
          first?: string; // Base64url-encoded PRF output
          second?: string; // Base64url-encoded PRF output (if provided)
        };
      };
      largeBlob?: {
        supported?: boolean; // True if large blob is supported
      };
    };
  };
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
```

## `listPasskeys(relyingPartyId)`

Lists all platform passkeys stored on the device for a given relying party.

> [!NOTE]
> Requires macOS 13.3+ and the `com.apple.developer.web-browser.public-key-credential` entitlement. See the [Entitlements and Provisioning Guide](./entitlements-and-provisioning.md) for setup instructions.

On first call, macOS will prompt the user to grant your app access to stored passkeys via a system permission dialog. If the user denies, subsequent calls will return an error until the permission is re-granted in **System Settings > Privacy & Security**.

### Parameters

- **`relyingPartyId: string`** (required) - The relying party identifier (e.g., `"example.com"`)

### Returns

`Promise<ListPasskeysResult | ListPasskeysError>` - Resolves with the list of credentials or an error object

### Result Types

```typescript
type ListPasskeysResult = {
  success: true;
  credentials: PasskeyCredential[];
};

type ListPasskeysError = {
  success: false;
  error: Error; // Includes message with details (e.g., permission denied, unsupported OS)
};

interface PasskeyCredential {
  id: string;         // Base64url-encoded credential ID
  rpId: string;       // The relying party identifier
  userName: string;   // The user name associated with the credential
  userHandle: string; // Base64url-encoded user handle
}
```

### Error Scenarios

- **Unsupported OS**: Throws if the current macOS version is below 13.3
- **Permission denied**: Throws if the user denied access in the system permission dialog
- **Missing entitlement**: The `com.apple.developer.web-browser.public-key-credential` entitlement must be present

---

## `getCredential(publicKeyOptions, additionalOptions)`

Performs a WebAuthn assertion (authentication) using available platform and cross-platform authenticators.

**Note:** You can plug any `publicKeyOptions` from the standard `navigator.credentials.get({ publicKey: ... })` directly into this function.

### Parameters

#### `publicKeyOptions: PublicKeyCredentialRequestOptions`

Standard W3C WebAuthn credential request options. See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions) for more details.

#### `additionalOptions: WebauthnGetRequestOptions`

Additional options specific to the Electron environment:

- **`currentOrigin: string`** (required) - The origin of the requesting document (e.g., "https://example.com")
- **`topFrameOrigin: string | undefined`** - The origin of the top frame (for iframe support). Set to `currentOrigin` if not in an iframe
- **`nativeWindowHandle: Buffer`** (required) - Native window handle from `BrowserWindow.getNativeWindowHandle()`, or a pointer to a NSView object
- **`isPublicSuffix?: (domain: string) => boolean`** - Optional function to check if a domain is a public suffix (e.g., "com", "co.uk"). Strongly recommended for security. Use a library like `tldts` for implementation

### Returns

`Promise<GetCredentialResult>` - Resolves with the assertion result (that you can transform into a `PublicKeyCredential` object) or error

### Result Types

```typescript
type GetCredentialResult =
  | GetCredentialSuccessResult
  | GetCredentialErrorResult;

interface GetCredentialSuccessResult {
  success: true;
  data: {
    credentialId: string; // Base64url-encoded credential ID
    clientDataJSON: string; // Base64url-encoded client data
    authenticatorData: string; // Base64url-encoded authenticator data
    signature: string; // Base64url-encoded signature
    userHandle: string; // Base64url-encoded user handle
    extensions?: {
      prf?: {
        results?: {
          first: string; // Base64url-encoded PRF output
          second?: string; // Base64url-encoded PRF output (if provided)
        };
      };
      largeBlob?: {
        blob?: string; // Base64url-encoded blob data (if read)
        written?: boolean; // True if write succeeded (if write was requested)
      };
    };
  };
}

interface GetCredentialErrorResult {
  success: false;
  error: "TypeError" | "AbortError" | "NotAllowedError" | "SecurityError";
}
```
