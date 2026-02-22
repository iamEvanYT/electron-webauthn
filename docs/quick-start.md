# Quick Start

> **💡 Drop-in Compatibility:** Simply plug any `publicKeyOptions` from the standard `navigator.credentials.create()` or `navigator.credentials.get()` APIs directly into these functions. They follow the W3C WebAuthn specification exactly.

## Creating a Credential (Registration)

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

## Listing Stored Passkeys

> [!NOTE]
> Requires macOS 13.3+ and the `com.apple.developer.web-browser.public-key-credential` entitlement.

```typescript
import { listPasskeys } from "electron-webauthn";

async function showPasskeys() {
  const result = await listPasskeys("example.com");

  if (result.success) {
    console.log(`Found ${result.credentials.length} passkey(s):`);
    result.credentials.forEach((cred) => {
      console.log(`- ${cred.userName} (id: ${cred.id.substring(0, 20)}...)`);
    });
  } else {
    console.error("Failed to list passkeys:", result.error.message);
  }
}
```

On first use, macOS will show a system permission dialog asking the user to grant access to stored passkeys. If denied, you can direct the user to **System Settings > Privacy & Security** to re-enable access.

## Authenticating with a Credential

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
