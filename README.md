# electron-webauthn

Add native WebAuthn/FIDO2 support to Electron on macOS using its AuthenticationServices framework.

## Overview

`electron-webauthn` allows you to process WebAuthn requests on macOS Electron. Simply plug any `publicKeyOptions` from the standard `navigator.credentials.get()` or `navigator.credentials.create()` directly into this library's functions and they'll work with the native macOS authenticators.

This package provides JavaScript bindings to Apple's AuthenticationServices framework, allowing you to perform WebAuthn credential creation (registration) and assertions (authentication/signing) in your Electron applications using W3C WebAuthn-compliant APIs.

> [!NOTE]
> Although this library is called `electron-webauthn`, it can be used in Node.js and Bun projects as well, not just Electron.

## Features

- Native WebAuthn support for Electron on macOS
- Support for platform authenticators (Touch ID, Face ID)
- Support for cross-platform authenticators (external security keys)
- TypeScript first with complete type definitions
- **W3C WebAuthn-compliant API** - drop in any standard `publicKeyOptions` and it just works
- Credential creation (registration) with attestation
- Credential authentication (assertions) with existing credentials
- Seamless integration with Electron's native window system
- Passkey listing via `listPasskeys` (macOS 13.3+)
- PRF (Pseudo-Random Function) extension support
- Large Blob extension support for reading/writing credential-specific data
- User verification preference configuration (preferred, required, discouraged)
- Proper origin validation with public suffix list support
- Cross-origin iframe support with `topFrameOrigin`
- Per-credential PRF evaluation with `evalByCredential`
- Resident key (discoverable credential) support

## Installation

### Prerequisites

- Node.js / Bun
- Xcode Command Line Tools (Run `xcode-select --install` to install)
- `pkg-config` from Homebrew (Run `brew install pkgconf` to install)

### Install using npm, bun, pnpm, or yarn

```bash
npm install electron-webauthn
# or
bun add electron-webauthn
# or
pnpm add electron-webauthn
# or
yarn add electron-webauthn
```

### Requirements

- Electron 28+
- macOS 12.0+
- TypeScript 5+ (peer dependency)

## Quick Start

See the [Quick Start Guide](./docs/quick-start.md) for detailed examples on credential creation and authentication.

## Configure Entitlements and Provisioning

See the [Entitlements and Provisioning Guide](./docs/entitlements-and-provisioning.md) for detailed instructions on how to configure entitlements and provisioning for your Electron application.

## API Reference

See the [API Reference](./docs/api-reference.md) for detailed documentation on all available functions and types.

## Advanced Examples

See the [Advanced Examples](./docs/advanced-examples.md) for detailed examples on how to use the library with more complex use cases.

## Architecture

This library implements the W3C WebAuthn standard using Apple's native AuthenticationServices framework. It provides a standards-compliant API that works seamlessly with existing WebAuthn servers and libraries. Under the hood, it:

- Validates origins and Relying Party IDs according to the WebAuthn specification
- Generates proper client data with `crossOrigin` field support (fixing Apple's default behavior)
- Handles both platform (Touch ID/Face ID) and cross-platform (security keys) authenticators simultaneously
- Properly manages WebAuthn extensions (PRF, Large Blob)
- Returns base64url-encoded values ready to send to your server for verification

## Error Handling

`createCredential`, `getCredential`, and `listPasskeys` all return a result object with a `success` field. Always check this field:

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

`listPasskeys` returns an `Error` object (not a string code) when unsuccessful:

```typescript
const result = await listPasskeys("example.com");

if (!result.success) {
  console.error("Failed to list passkeys:", result.error.message);
  return;
}

console.log(`Found ${result.credentials.length} passkeys`);
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
- ✅ Passkey listing with `listPasskeys` (macOS 13.3+, requires `com.apple.developer.web-browser.public-key-credential` entitlement)
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

### Security Recommendations

- **Implement public suffix list validation** using `tldts` or similar library

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
