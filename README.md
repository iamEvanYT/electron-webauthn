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
    nativeWindowHandle, // Native window for UI presentation
    [] // Optional: allowed credential IDs
  );

  console.log(result);
  // Result contains:
  // - id: Credential ID (Buffer)
  // - authenticatorAttachment: 'platform' | 'cross-platform'
  // - clientDataJSON: Raw client data (Buffer)
  // - authenticatorData: Authenticator data (Buffer)
  // - signature: Assertion signature (Buffer)
  // - userHandle: User handle (Buffer)
}
```

## API Reference

### `getCredential(rpid, challenge, nativeWindowHandle, allowedCredentialIds)`

Performs a WebAuthn assertion (authentication) using available platform and cross-platform authenticators.

#### Parameters

- **`rpid: string`** - The Relying Party ID (typically your domain)
- **`challenge: Buffer`** - The challenge from your server (32+ bytes recommended)
- **`nativeWindowHandle: Buffer`** - The native window handle from Electron
- **`allowedCredentialIds: Buffer[]`** - Optional array of credential IDs the user can use (empty = all registered credentials)

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
}
```

## Architecture

### Package Structure

```
src/
├── index.ts                           # Main export - getCredential function
├── helpers.ts                         # Utility functions
├── objc/
│   ├── authentication-services/       # AuthenticationServices framework bindings
│   │   ├── as-authorization-*.ts      # Authorization request/response objects
│   │   ├── enums/                     # Enumeration values
│   │   └── index.ts                   # Exports
│   └── foundation/                    # Foundation framework bindings
│       ├── nsdata.ts                  # NSData (binary data) bindings
│       ├── nsstring.ts                # NSString bindings
│       ├── nsarray.ts                 # NSArray bindings
│       ├── nserror.ts                 # NSError bindings
│       ├── nsview.ts                  # NSView bindings
│       ├── nswindow.ts                # NSWindow bindings
│       └── index.ts                   # Exports
└── test/                              # Test utilities
    ├── index.ts                       # Test script
    ├── window.ts                      # Test window helpers
    └── example.ts                     # Example usage
```

### Dependencies

- **objc-js** - Native Objective-C bindings for JavaScript
- **TypeScript** - For type checking and compilation

## How It Works

1. **Request Creation**: The library creates a `ASAuthorizationPlatformPublicKeyCredentialProvider` with your RP ID
2. **Request Configuration**: Sets up the challenge and optional allowed credentials list
3. **Controller Setup**: Creates an `ASAuthorizationController` to manage the authentication flow
4. **Delegation**: Registers delegates to handle success/error responses from the system
5. **Presentation**: Shows the native authentication UI in your window
6. **Result Processing**: Converts Objective-C objects to JavaScript Buffers and returns the assertion data

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
  return getCredential("myapp.com", challenge, nativeHandle, []);
}
```

### Restricting to Specific Credentials

```typescript
// Only allow specific registered credentials
const result = await getCredential(
  "myapp.com",
  challenge,
  nativeWindowHandle,
  [credentialId1, credentialId2] // User can only use these credentials
);
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
    nativeWindowHandle,
    []
  );
} catch (error) {
  console.error("Authentication failed:", error.message);
  // Handle error appropriately
}
```

## Platform Support

| Platform  | Support          |
| --------- | ---------------- |
| macOS 12+ | ✅ Full support  |
| Windows   | ❌ Not supported |
| Linux     | ❌ Not supported |
| iOS       | ❌ Not supported |

## WebAuthn Spec Compliance

This library implements the WebAuthn Level 2 specification for the assertion (authentication) operation:

- ✅ Public Key Credential (assertions)
- ✅ Platform authenticators (built-in)
- ✅ Cross-platform authenticators (external)
- ❌ Credential registration (create)
- ℹ️ See [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)

## Development

### Building

```bash
bun run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Contributing

Contributions are welcome! Please ensure:

1. Code is properly typed with TypeScript
2. New features include appropriate documentation
3. Tests pass with `bun run test`
4. Code builds successfully with `bun run build`

## License

See [LICENSE](./LICENSE) file for details.

## Related Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Apple AuthenticationServices Documentation](https://developer.apple.com/documentation/authenticationservices)
- [Electron Documentation](https://www.electronjs.org/docs)
- [objc-js Library](https://github.com/iamEvanYT/objc-js)
