# electron-webauthn

Add native WebAuthn/FIDO2 support to Electron on macOS using its AuthenticationServices framework.

## Overview

`electron-webauthn` is a TypeScript library that bridges Electron with the native macOS AuthenticationServices framework, enabling WebAuthn/FIDO2 authentication directly through native platform authenticators (Touch ID, Face ID, hardware security keys, etc.).

This package provides JavaScript bindings to Apple's AuthenticationServices framework, allowing you to perform WebAuthn assertions (authentication/signing with existing credentials) in your Electron applications using W3C WebAuthn-compliant APIs.

## Features

- Native WebAuthn support for Electron on macOS
- Support for platform authenticators (Touch ID, Face ID)
- Support for cross-platform authenticators (external security keys)
- TypeScript first with complete type definitions
- W3C WebAuthn-compliant API
- Seamless integration with Electron's native window system
- PRF (Pseudo-Random Function) extension support
- Large Blob extension support for reading/writing credential-specific data
- User verification preference configuration (preferred, required, discouraged)
- Proper origin validation with public suffix list support
- Cross-origin iframe support with `topFrameOrigin`
- Per-credential PRF evaluation with `evalByCredential`

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

```typescript
import { getCredential } from "electron-webauthn";
import { getPointer } from "objc-js";
import { BrowserWindow } from "electron";

// In your Electron main process or preload script
async function authenticate(window: BrowserWindow, challenge: ArrayBuffer) {
  // Get the native window handle from your BrowserWindow
  const nativeWindowHandle = getPointer(window.getNativeWindowHandle());

  // Call getCredential with W3C WebAuthn-compliant options
  const result = await getCredential(
    {
      challenge: challenge,
      rpId: "example.com",
      timeout: 60000, // Optional: 60 seconds
      userVerification: "preferred", // Optional: "preferred" | "required" | "discouraged"
      allowCredentials: [], // Optional: restrict to specific credentials
      extensions: {
        // Optional extensions
        prf: {
          eval: {
            first: new Uint8Array(32), // 32 bytes
          },
        },
        largeBlob: {
          read: true,
        },
      },
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

### `getCredential(publicKeyOptions, additionalOptions)`

Performs a WebAuthn assertion (authentication) using available platform and cross-platform authenticators. This function follows the W3C WebAuthn specification.

#### Parameters

##### `publicKeyOptions: PublicKeyCredentialRequestOptions`

You can plug the `publicKeyOptions` from `navigator.credentials.get()` directly onto this function.

Standard W3C WebAuthn credential request options:

- **`challenge: BufferSource`** (required) - The challenge from your server (32+ bytes recommended)
- **`rpId: string`** (required) - The Relying Party ID (typically your domain, e.g., "example.com")
- **`timeout?: number`** - Timeout in milliseconds (default: 10 minutes, max: 1 hour)
- **`userVerification?: string`** - User verification preference:
  - `"preferred"` - User verification is preferred but not required (default)
  - `"required"` - User verification is required (e.g., biometric or PIN)
  - `"discouraged"` - User verification should be discouraged
- **`allowCredentials?: PublicKeyCredentialDescriptor[]`** - Optional array to restrict allowed credentials:
  ```typescript
  {
    type: "public-key",
    id: BufferSource, // Credential ID from registration
  }
  ```
- **`extensions?: AuthenticationExtensionsClientInputs`** - Optional WebAuthn extensions:
  - **`prf`** - Pseudo-Random Function extension:
    ```typescript
    {
      eval?: {
        first: BufferSource,  // 32+ bytes
        second?: BufferSource // 32+ bytes (optional)
      },
      evalByCredential?: {
        [base64UrlCredentialId: string]: {
          first: BufferSource,
          second?: BufferSource
        }
      }
    }
    ```
  - **`largeBlob`** - Large Blob extension:
    ```typescript
    {
      read?: boolean,        // Read existing blob
      write?: BufferSource   // Write new blob data
    }
    ```

##### `additionalOptions: WebauthnGetRequestOptions`

Additional options specific to the Electron environment:

- **`currentOrigin: string`** (required) - The origin of the requesting document (e.g., "https://example.com")
- **`topFrameOrigin: string | undefined`** - The origin of the top frame (for iframe support). Set to `currentOrigin` if not in an iframe
- **`nativeWindowHandle: Buffer`** (required) - Native window handle from `BrowserWindow.getNativeWindowHandle()` wrapped with `getPointer()` from `objc-js`
- **`isPublicSuffix?: (domain: string) => boolean`** - Optional function to check if a domain is a public suffix (e.g., "com", "co.uk"). Strongly recommended for security. Use a library like `tldts` for implementation

#### Returns

`Promise<GetCredentialResult>` - Resolves with the assertion result or error

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

### Basic Authentication

```typescript
import { getCredential } from "electron-webauthn";
import { getPointer } from "objc-js";
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
  const nativeHandle = getPointer(mainWindow.getNativeWindowHandle());

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

### Using PRF Extension

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

### Server-Side Verification

After getting the assertion result, verify it on your server using any WebAuthn library:

```typescript
// Example with @simplewebauthn/server (Node.js)
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

// The result.data object contains base64url-encoded values
const verification = await verifyAuthenticationResponse({
  response: {
    id: result.data.credentialId,
    rawId: result.data.credentialId,
    response: {
      clientDataJSON: result.data.clientDataJSON,
      authenticatorData: result.data.authenticatorData,
      signature: result.data.signature,
      userHandle: result.data.userHandle,
    },
    type: "public-key",
  },
  expectedChallenge: "expected-challenge-from-session",
  expectedOrigin: "https://myapp.com",
  expectedRPID: "myapp.com",
  authenticator: {
    credentialID: savedCredentialId,
    credentialPublicKey: savedPublicKey,
    counter: savedCounter,
  },
});

if (verification.verified) {
  console.log("Authentication successful!");
}
```

## Error Handling

The `getCredential` function returns a result object with a `success` field. Always check this field:

```typescript
const result = await getCredential(publicKeyOptions, additionalOptions);

if (!result.success) {
  // Handle specific error types
  switch (result.error) {
    case "TypeError":
      console.error("Invalid parameters provided");
      break;
    case "NotAllowedError":
      console.error("User cancelled or no credentials available");
      break;
    case "SecurityError":
      console.error("Origin or rpId validation failed");
      break;
    case "AbortError":
      console.error("Operation was aborted");
      break;
  }
  return;
}

// Success - process the credential
console.log("Credential ID:", result.data.credentialId);
```

### Common Error Scenarios

- **NotAllowedError**: User cancelled the prompt, no valid credentials available, or the authenticator failed
- **SecurityError**: Origin doesn't match rpId, invalid origin format, or rpId is a public suffix
- **TypeError**: Invalid parameter types (missing required fields, wrong data types)
- **AbortError**: Operation timeout or explicitly aborted

## Feature Support

**Currently Supported:**

- ✅ WebAuthn assertions (authentication with existing credentials)
- ✅ Cross-platform authenticators (external security keys like YubiKey)
- ✅ Platform authenticators (Touch ID, Face ID)
- ✅ PRF (Pseudo-Random Function) extension
  - ✅ Global evaluation (`eval`)
  - ✅ Per-credential evaluation (`evalByCredential`)
- ✅ Large Blob extension
  - ✅ Reading blobs
  - ✅ Writing blobs
- ✅ User verification preferences
- ✅ Credential filtering with `allowCredentials`
- ✅ Proper origin and rpId validation
- ✅ Cross-origin iframe support
- ✅ W3C WebAuthn-compliant client data generation

**Not Yet Supported:**

- ❌ Credential registration (attestation) - coming soon
- ❌ Discoverable credentials (resident keys)
- ❌ Conditional UI
- ❌ Other WebAuthn extensions (credProtect, minPinLength, etc.)

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
  GetCredentialResult,
  GetCredentialSuccessData,
  PublicKeyCredentialRequestOptions,
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

- **PRF and Large Blob**: Only supported on platform authenticators (Touch ID/Face ID), not security keys on macOS

## License

See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Resources

- [W3C WebAuthn Level 3 Specification](https://www.w3.org/TR/webauthn-3/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [objc-js Library](https://github.com/iamEvanYT/objc-js)
