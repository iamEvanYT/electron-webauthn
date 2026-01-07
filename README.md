# electron-webauthn

Add native WebAuthn/FIDO2 support to Electron on macOS using its AuthenticationServices framework.

## Overview

`electron-webauthn` allows you to process WebAuthn requests on macOS Electron. Simply plug any `publicKeyOptions` from the standard `navigator.credentials.get()` or `navigator.credentials.create()` directly into this library's functions and they'll work with the native macOS authenticators.

This package provides JavaScript bindings to Apple's AuthenticationServices framework, allowing you to perform WebAuthn credential creation (registration) and assertions (authentication/signing) in your Electron applications using W3C WebAuthn-compliant APIs.

## Features

- Native WebAuthn support for Electron on macOS
- Support for platform authenticators (Touch ID, Face ID)
- Support for cross-platform authenticators (external security keys)
- TypeScript first with complete type definitions
- **W3C WebAuthn-compliant API** - drop in any standard `publicKeyOptions` and it just works
- Credential creation (registration) with attestation
- Credential authentication (assertions) with existing credentials
- Seamless integration with Electron's native window system
- PRF (Pseudo-Random Function) extension support
- Large Blob extension support for reading/writing credential-specific data
- User verification preference configuration (preferred, required, discouraged)
- Proper origin validation with public suffix list support
- Cross-origin iframe support with `topFrameOrigin`
- Per-credential PRF evaluation with `evalByCredential`
- Resident key (discoverable credential) support

## Installation

```bash
npm install electron-webauthn
# or
bun add electron-webauthn
# or
yarn add electron-webauthn
```

### Requirements

- Electron 28+
- macOS 12.0+
- TypeScript 5+ (peer dependency)

## Quick Start

> **💡 Drop-in Compatibility:** Simply plug any `publicKeyOptions` from the standard `navigator.credentials.create()` or `navigator.credentials.get()` APIs directly into these functions. They follow the W3C WebAuthn specification exactly.

### Creating a Credential (Registration)

```typescript
import { createCredential } from "electron-webauthn";
import { BrowserWindow } from "electron";

// In your Electron main process or preload script
async function register(window: BrowserWindow, challenge: ArrayBuffer) {
  // Get the native window handle from your BrowserWindow
  const nativeWindowHandle = window.getNativeWindowHandle();

  // Call createCredential with W3C WebAuthn-compliant options
  // You can plug any publicKeyOptions from navigator.credentials.create() here
  const result = await createCredential(
    {
      challenge: challenge,
      rp: {
        name: "Example App",
        id: "example.com",
      },
      user: {
        id: new Uint8Array(16), // Random user ID
        name: "user@example.com",
        displayName: "User Name",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000, // Optional: 60 seconds
      attestation: "none", // Optional: "none" | "indirect" | "direct"
      authenticatorSelection: {
        userVerification: "preferred", // Optional: "preferred" | "required" | "discouraged"
        residentKey: "preferred", // Optional: "discouraged" | "preferred" | "required"
      },
    },
    {
      currentOrigin: "https://example.com",
      topFrameOrigin: "https://example.com",
      nativeWindowHandle: nativeWindowHandle,
    }
  );

  if (result.success) {
    console.log("Registration successful!");
    console.log("Credential ID:", result.data.credentialId);
    console.log("Public Key:", result.data.publicKey);
    // Result contains base64url-encoded strings ready to send to server
  } else {
    console.error("Registration failed:", result.error);
  }
}
```

### Authenticating with a Credential

```typescript
import { getCredential } from "electron-webauthn";
import { BrowserWindow } from "electron";

// In your Electron main process or preload script
async function authenticate(window: BrowserWindow, challenge: ArrayBuffer) {
  // Get the native window handle from your BrowserWindow
  const nativeWindowHandle = window.getNativeWindowHandle();

  // Call getCredential with W3C WebAuthn-compliant options
  // You can plug any publicKeyOptions from navigator.credentials.get() here
  const result = await getCredential(
    {
      challenge: challenge,
      rpId: "example.com",
      timeout: 60000, // Optional: 60 seconds
      userVerification: "preferred", // Optional: "preferred" | "required" | "discouraged"
      allowCredentials: [], // Optional: restrict to specific credentials
    },
    {
      currentOrigin: "https://example.com",
      topFrameOrigin: "https://example.com", // Use for iframe support
      nativeWindowHandle: nativeWindowHandle,
    }
  );

  if (result.success) {
    console.log("Authentication successful!");
    console.log("Credential ID:", result.data.credentialId);
    console.log("Signature:", result.data.signature);
    // Result contains base64url-encoded strings ready to send to server
  } else {
    console.error("Authentication failed:", result.error);
  }
}
```

## API Reference

### `createCredential(publicKeyOptions, additionalOptions)`

Creates and registers a new WebAuthn credential using available platform and cross-platform authenticators.

**Note:** You can plug any `publicKeyOptions` from the standard `navigator.credentials.create({ publicKey: ... })` directly into this function.

#### Parameters

##### `publicKeyOptions: PublicKeyCredentialCreationOptions`

Standard W3C WebAuthn credential creation options. See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions) for more details.

##### `additionalOptions: WebauthnCreateRequestOptions`

Additional options specific to the Electron environment:

- **`currentOrigin: string`** (required) - The origin of the requesting document (e.g., "https://example.com")
- **`topFrameOrigin: string | undefined`** - The origin of the top frame (for iframe support). Set to `currentOrigin` if not in an iframe
- **`nativeWindowHandle: Buffer`** (required) - Native window handle from `BrowserWindow.getNativeWindowHandle()`, or a pointer to a NSView object
- **`isPublicSuffix?: (domain: string) => boolean`** - Optional function to check if a domain is a public suffix (e.g., "com", "co.uk"). Strongly recommended for security

#### Returns

`Promise<CreateCredentialResult>` - Resolves with the registration result (that you can transform into a `PublicKeyCredential` object) or error

#### Result Types

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

### `getCredential(publicKeyOptions, additionalOptions)`

Performs a WebAuthn assertion (authentication) using available platform and cross-platform authenticators.

**Note:** You can plug any `publicKeyOptions` from the standard `navigator.credentials.get({ publicKey: ... })` directly into this function.

#### Parameters

##### `publicKeyOptions: PublicKeyCredentialRequestOptions`

Standard W3C WebAuthn credential request options. See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions) for more details.

##### `additionalOptions: WebauthnGetRequestOptions`

Additional options specific to the Electron environment:

- **`currentOrigin: string`** (required) - The origin of the requesting document (e.g., "https://example.com")
- **`topFrameOrigin: string | undefined`** - The origin of the top frame (for iframe support). Set to `currentOrigin` if not in an iframe
- **`nativeWindowHandle: Buffer`** (required) - Native window handle from `BrowserWindow.getNativeWindowHandle()`, or a pointer to a NSView object
- **`isPublicSuffix?: (domain: string) => boolean`** - Optional function to check if a domain is a public suffix (e.g., "com", "co.uk"). Strongly recommended for security. Use a library like `tldts` for implementation

#### Returns

`Promise<GetCredentialResult>` - Resolves with the assertion result (that you can transform into a `PublicKeyCredential` object) or error

#### Result Types

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

## Architecture

This library implements the W3C WebAuthn standard using Apple's native AuthenticationServices framework. It provides a standards-compliant API that works seamlessly with existing WebAuthn servers and libraries. Under the hood, it:

- Validates origins and Relying Party IDs according to the WebAuthn specification
- Generates proper client data with `crossOrigin` field support (fixing Apple's default behavior)
- Handles both platform (Touch ID/Face ID) and cross-platform (security keys) authenticators simultaneously
- Properly manages WebAuthn extensions (PRF, Large Blob)
- Returns base64url-encoded values ready to send to your server for verification

## Usage Examples

### Basic Registration

```typescript
import { createCredential } from "electron-webauthn";
import { app, BrowserWindow } from "electron";

let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: "./preload.js",
    },
  });
  mainWindow.loadURL("https://myapp.com");
});

// In your preload script or main process
export async function registerUser(
  challenge: ArrayBuffer,
  userId: ArrayBuffer,
  userName: string,
  userDisplayName: string
) {
  const nativeHandle = mainWindow.getNativeWindowHandle();

  const result = await createCredential(
    {
      challenge: challenge,
      rp: {
        name: "My App",
        id: "myapp.com",
      },
      user: {
        id: userId,
        name: userName,
        displayName: userDisplayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        userVerification: "preferred",
      },
    },
    {
      currentOrigin: "https://myapp.com",
      topFrameOrigin: "https://myapp.com",
      nativeWindowHandle: nativeHandle,
    }
  );

  return result;
}
```

### Basic Authentication

```typescript
import { getCredential } from "electron-webauthn";
import { app, BrowserWindow } from "electron";

let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: "./preload.js",
    },
  });
  mainWindow.loadURL("https://myapp.com");
});

// In your preload script or main process
export async function authenticateUser(challenge: ArrayBuffer) {
  const nativeHandle = mainWindow.getNativeWindowHandle();

  const result = await getCredential(
    {
      challenge: challenge,
      rpId: "myapp.com",
      userVerification: "preferred",
    },
    {
      currentOrigin: "https://myapp.com",
      topFrameOrigin: "https://myapp.com",
      nativeWindowHandle: nativeHandle,
    }
  );

  return result;
}
```

### Restricting to Specific Credentials

```typescript
// Only allow specific registered credentials
const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    allowCredentials: [
      { type: "public-key", id: credentialId1 },
      { type: "public-key", id: credentialId2 },
    ],
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);
```

### With Required User Verification

```typescript
// Require user verification (e.g., for sensitive operations)
const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    userVerification: "required", // Force biometric or PIN
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);
```

### Creating Resident Keys (Discoverable Credentials)

```typescript
// Create a discoverable credential that can be used without specifying allowCredentials
const result = await createCredential(
  {
    challenge: challenge,
    rp: { name: "My App", id: "myapp.com" },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    authenticatorSelection: {
      residentKey: "required", // Require resident key
      userVerification: "required", // Usually combined with resident keys
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);
```

### Preventing Duplicate Registrations

```typescript
// Prevent user from registering the same authenticator multiple times
const result = await createCredential(
  {
    challenge: challenge,
    rp: { name: "My App", id: "myapp.com" },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    excludeCredentials: [
      // List of credentials already registered for this user
      { type: "public-key", id: existingCredentialId1 },
      { type: "public-key", id: existingCredentialId2 },
    ],
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);

// If user tries to use an excluded authenticator, you'll get:
// { success: false, error: "InvalidStateError" }
```

### Creating Credentials with PRF Extension

```typescript
// Register a credential with PRF support and immediately evaluate it
const prfSalt = crypto.getRandomValues(new Uint8Array(32));

const result = await createCredential(
  {
    challenge: challenge,
    rp: { name: "My App", id: "myapp.com" },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    extensions: {
      prf: {
        eval: {
          first: prfSalt,
        },
      },
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);

if (result.success && result.data.extensions?.prf?.results?.first) {
  console.log(
    "PRF is supported and evaluated:",
    result.data.extensions.prf.results.first
  );
  // Use this PRF output as an encryption key
}
```

### Using PRF Extension (Authentication)

The PRF (Pseudo-Random Function) extension allows you to derive cryptographic secrets from credentials:

```typescript
// Generate a random salt for PRF
const prfSalt = crypto.getRandomValues(new Uint8Array(32));

const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    extensions: {
      prf: {
        eval: {
          first: prfSalt,
          // second: optionalSecondSalt, // Optional second output
        },
      },
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);

if (result.success && result.data.extensions?.prf?.results) {
  const prfOutput = result.data.extensions.prf.results.first;
  // Use prfOutput as a cryptographic key for encryption, etc.
  console.log("PRF output:", prfOutput);
}
```

### Using PRF with Per-Credential Evaluation

```typescript
import { bufferToBase64Url } from "./helpers"; // You'll need to implement this

const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    allowCredentials: [
      { type: "public-key", id: credentialId1 },
      { type: "public-key", id: credentialId2 },
    ],
    extensions: {
      prf: {
        evalByCredential: {
          [bufferToBase64Url(credentialId1)]: {
            first: new Uint8Array(32), // Different salt for credential 1
          },
          [bufferToBase64Url(credentialId2)]: {
            first: new Uint8Array(32), // Different salt for credential 2
          },
        },
      },
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);
```

### Reading and Writing Large Blobs

```typescript
// Reading a large blob
const readResult = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    extensions: {
      largeBlob: {
        read: true,
      },
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);

if (readResult.success && readResult.data.extensions?.largeBlob?.blob) {
  console.log("Large blob data:", readResult.data.extensions.largeBlob.blob);
}

// Writing a large blob
const dataToWrite = new TextEncoder().encode("Secret data");
const writeResult = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
    extensions: {
      largeBlob: {
        write: dataToWrite,
      },
    },
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
  }
);

if (writeResult.success && writeResult.data.extensions?.largeBlob?.written) {
  console.log("Large blob written successfully");
}
```

### With Public Suffix List Validation

For enhanced security, use a public suffix list library like `tldts`:

```typescript
import { getPublicSuffix } from "tldts";

const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
  },
  {
    currentOrigin: "https://myapp.com",
    topFrameOrigin: "https://myapp.com",
    nativeWindowHandle: nativeHandle,
    isPublicSuffix: (domain) => {
      const suffix = getPublicSuffix(domain);
      return suffix === domain;
    },
  }
);
```

### Supporting Cross-Origin Iframes

If your app loads WebAuthn requests from an iframe:

```typescript
const result = await getCredential(
  {
    challenge: challenge,
    rpId: "myapp.com",
  },
  {
    currentOrigin: "https://auth.myapp.com", // The iframe's origin
    topFrameOrigin: "https://myapp.com", // The parent page's origin
    nativeWindowHandle: nativeHandle,
  }
);
```

## Error Handling

Both `createCredential` and `getCredential` functions return a result object with a `success` field. Always check this field:

```typescript
const result = await createCredential(publicKeyOptions, additionalOptions);
// or
const result = await getCredential(publicKeyOptions, additionalOptions);

if (!result.success) {
  // Handle specific error types
  switch (result.error) {
    case "TypeError":
      console.error("Invalid parameters provided");
      break;
    case "NotAllowedError":
      console.error("User cancelled or operation not allowed");
      break;
    case "SecurityError":
      console.error("Origin or rpId validation failed");
      break;
    case "AbortError":
      console.error("Operation was aborted");
      break;
    case "InvalidStateError":
      console.error(
        "Authenticator is in invalid state (e.g., credential already registered)"
      );
      break;
  }
  return;
}

// Success - process the credential
console.log("Credential ID:", result.data.credentialId);
```

### Common Error Scenarios

#### For Both Registration and Authentication

- **TypeError**: Invalid parameter types (missing required fields, wrong data types)
- **NotAllowedError**: User cancelled the prompt or the authenticator failed
- **SecurityError**: Origin doesn't match rpId, invalid origin format, or rpId is a public suffix
- **AbortError**: Operation timeout or explicitly aborted

#### Registration-Specific (`createCredential`)

- **InvalidStateError**: The authenticator attempted to register a credential that matches one in the `excludeCredentials` list (prevents duplicate registrations)

#### Authentication-Specific (`getCredential`)

- **NotAllowedError**: No valid credentials available for the specified rpId

## Feature Support

**Currently Supported:**

- ✅ WebAuthn credential creation (registration/attestation)
- ✅ WebAuthn assertions (authentication with existing credentials)
- ✅ Cross-platform authenticators (external security keys like YubiKey)
- ✅ Platform authenticators (Touch ID, Face ID)
- ✅ Discoverable credentials (resident keys)
- ✅ Attestation formats (none, indirect, direct)
- ✅ Duplicate credential prevention with `excludeCredentials`
- ✅ PRF (Pseudo-Random Function) extension
  - ✅ Global evaluation (`eval`) for both registration and authentication
  - ✅ Per-credential evaluation (`evalByCredential`) for authentication
- ✅ Large Blob extension
  - ✅ Support indication during registration
  - ✅ Reading blobs during authentication
  - ✅ Writing blobs during authentication
- ✅ credProps extension (credential properties)
- ✅ User verification preferences (required, preferred, discouraged)
- ✅ Credential filtering with `allowCredentials`
- ✅ Proper origin and rpId validation
- ✅ Cross-origin iframe support
- ✅ W3C WebAuthn-compliant client data generation

**Not Yet Supported:**

- ❌ Conditional UI (autofill/conditional mediation)
- ❌ Other WebAuthn extensions (credProtect, minPinLength, hmac-secret, etc.)

## Best Practices

### Security Recommendations

1. **Always use HTTPS origins** in production (unless testing on `localhost`)
2. **Implement public suffix list validation** using `tldts` or similar library
3. **Validate rpId carefully** - it should match your domain
4. **Generate strong challenges** - use at least 32 random bytes from a CSPRNG
5. **Verify assertions on your server** - never trust client-side validation alone
6. **Store credential public keys securely** - needed for signature verification
7. **Implement proper timeout handling** - don't leave prompts open indefinitely

### Performance Tips

1. **Cache native window handles** - no need to get them on every call
2. **Reuse challenge buffers** when possible
3. **Set appropriate timeouts** - shorter for better UX, longer for hardware keys
4. **Handle user cancellation gracefully** - don't retry automatically

### TypeScript Types

This library exports all necessary TypeScript types. Import them for type safety:

```typescript
import type {
  // Registration types
  CreateCredentialResult,
  CreateCredentialSuccessData,
  PublicKeyCredentialCreationOptions,

  // Authentication types
  GetCredentialResult,
  GetCredentialSuccessData,
  PublicKeyCredentialRequestOptions,

  // Shared types
  AuthenticationExtensionsClientInputs,
  PRFInput,
} from "electron-webauthn";
```

## Debugging

Enable detailed logging by checking the console output. The library logs warnings for:

- PRF extension enabled but no input values provided
- Large blob write enabled but no data provided
- Authorization errors with native error messages

## Known Limitations

- **PRF and Large Blob extensions**: Only supported on platform authenticators (Touch ID/Face ID), not security keys on macOS
- **Attestation formats**: macOS typically returns "none" attestation even when "direct" or "indirect" is requested, unless the authenticator specifically supports it

## License

See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Resources

- [W3C WebAuthn Level 3 Specification](https://www.w3.org/TR/webauthn-3/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [objc-js Library](https://github.com/iamEvanYT/objc-js)
