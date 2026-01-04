# electron-webauthn

Add native WebAuthn/FIDO2 support to Electron using macOS AuthenticationServices framework.

## Overview

`electron-webauthn` is a TypeScript library that bridges Electron with the native macOS AuthenticationServices framework, enabling WebAuthn/FIDO2 authentication directly through native platform authenticators (Touch ID, Face ID, hardware security keys, etc.).

This package provides JavaScript bindings to Apple's AuthenticationServices framework, allowing you to perform WebAuthn assertions (authentication/signing with existing credentials) in your Electron applications.

## Features

- 🔐 Native WebAuthn support for Electron on macOS
- 🎯 Support for platform authenticators (Touch ID, Face ID)
- 🔑 Support for cross-platform authenticators (external security keys)
- 📦 TypeScript first with complete type definitions
- 🎨 Seamless integration with Electron's native window system
- 🔐 PRF (Pseudo-Random Function) support for credential assertions
- 💾 Large Blob support for storing credential-specific data
- ⚙️ User verification preference configuration (preferred, required, discouraged)

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

// In your Electron main process or preload script
async function authenticate() {
  // Get the native window handle from your BrowserWindow
  const nativeWindowHandle = getPointer(
    yourElectronWindow.getNativeWindowHandle()
  );

  // Call getCredential to prompt the user for authentication
  const result = await getCredential(
    "example.com", // Relying Party ID
    Buffer.from("your-challenge"), // Challenge from server
    "https://example.com", // Origin
    [], // Optional: allowed credential IDs
    "preferred" // Optional: user verification preference
  );

  console.log(result);
  // Result contains:
  // - id: Credential ID (Buffer)
  // - authenticatorAttachment: 'platform' | 'cross-platform'
  // - clientDataJSON: Raw client data (Buffer)
  // - authenticatorData: Authenticator data (Buffer)
  // - signature: Assertion signature (Buffer)
  // - userHandle: User handle (Buffer)
  // - prf: [Buffer | null, Buffer | null] - PRF output (if supported)
  // - largeBlob: Buffer | null - Large blob data (if supported)
}
```

## API Reference

### `getCredential(rpid, challenge, origin, allowedCredentialIds, userVerificationPreference)`

Performs a WebAuthn assertion (authentication) using available platform and cross-platform authenticators.

#### Parameters

- **`rpid: string`** - The Relying Party ID (typically your domain)
- **`challenge: Buffer`** - The challenge from your server (32+ bytes recommended)
- **`origin: string`** - The origin where the credential assertion will be used (e.g., "https://example.com")
- **`allowedCredentialIds: Buffer[]`** - Optional array of credential IDs the user can use (empty = all registered credentials)
- **`userVerificationPreference?: UserVerificationPreference`** - Optional preference for user verification. Can be:
  - `"preferred"` - User verification is preferred but not required (default)
  - `"required"` - User verification is required
  - `"discouraged"` - User verification should be discouraged

#### Returns

`Promise<GetCredentialResult>` - Resolves with the assertion result

#### Result Type

```typescript
interface GetCredentialResult {
  id: Buffer; // Credential ID
  authenticatorAttachment: "platform" | "cross-platform"; // Type of authenticator used
  clientDataJSON: Buffer; // Raw client data JSON (encoded as UTF-8 bytes)
  authenticatorData: Buffer; // Authenticator data from the device
  signature: Buffer; // Digital signature from the authenticator
  userHandle: Buffer; // User handle from the credential
  prf: [Buffer | null, Buffer | null]; // PRF output (if supported by authenticator)
  largeBlob: Buffer | null; // Large blob data (if supported by authenticator)
}
```

#### User Verification Preference Type

```typescript
type UserVerificationPreference = "preferred" | "required" | "discouraged";
```

## Architecture

This library implements the WebAuthn standard using native APIs. Under the hood it handles all the complexity of macOS's authentication system, so you just call `getCredential()` with your challenge and get back the signed assertion.

## Usage Examples

### Basic Authentication

```typescript
import { getCredential } from "electron-webauthn";
import { getPointer } from "objc-js";
import { app, BrowserWindow } from "electron";

let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: { preload: "./preload.js" },
  });
});

// In your preload script or main process
export async function authenticateUser(challenge: Buffer) {
  const nativeHandle = getPointer(mainWindow.getNativeWindowHandle());
  return getCredential("myapp.com", challenge, "https://myapp.com", []);
}
```

### Restricting to Specific Credentials

```typescript
// Only allow specific registered credentials
const result = await getCredential(
  "myapp.com",
  challenge,
  "https://myapp.com",
  [credentialId1, credentialId2] // User can only use these credentials
);
```

### With User Verification Requirement

```typescript
// Require user verification (e.g., for sensitive operations)
const result = await getCredential(
  "myapp.com",
  challenge,
  "https://myapp.com",
  [], // No credential restrictions
  "required" // Require user verification (biometric or PIN)
);
```

### Using PRF Output

```typescript
// Get credential with PRF support
const result = await getCredential(
  "myapp.com",
  challenge,
  "https://myapp.com",
  []
);

// PRF output is available in the result
const [prfFirst, prfSecond] = result.prf;
if (prfFirst) {
  // Use PRF output for additional cryptographic operations
  console.log("PRF first output:", prfFirst);
}
```

### Server-Side Verification

After getting the assertion result, verify it on your server:

```typescript
// Server-side (Node.js, Python, etc.)
// 1. Verify the signature using the public key from the credential registration
// 2. Check that the challenge matches what you sent
// 3. Verify the authenticator data flags
// 4. Check the user handle matches the authenticated user
```

## Error Handling

The `getCredential` promise will reject if:

- The user cancels the authentication prompt
- No valid credentials are available
- The authenticator fails
- The native window is invalid

```typescript
try {
  const result = await getCredential(
    "example.com",
    challenge,
    "https://example.com",
    []
  );
} catch (error) {
  console.error("Authentication failed:", error.message);
  // Handle error appropriately
}
```

**Supported:**

- ✅ WebAuthn assertions (authentication with existing credentials)
- ✅ Cross-platform authenticators (external security keys)
- ✅ Platform authenticators (Touch ID, Face ID)
- ✅ PRF (Pseudo-Random Function) output
- ✅ Large Blob support

**Not Supported:**

- ❌ Credential registration (attestation)
- ❌ Discoverable credentials

## License

See [LICENSE](./LICENSE) file for details.

## Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [objc-js Library](https://github.com/iamEvanYT/objc-js)
