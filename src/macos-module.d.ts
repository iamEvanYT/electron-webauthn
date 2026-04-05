declare module "@electron-webauthn/macos" {
  import type { WebauthnModule } from "@electron-webauthn/types";
  export const createCredential: WebauthnModule["createCredential"];
  export const getCredential: WebauthnModule["getCredential"];
  export const getListPasskeyAuthorizationStatus: WebauthnModule["getListPasskeyAuthorizationStatus"];
  export const listPasskeys: WebauthnModule["listPasskeys"];
  export const requestListPasskeyAuthorization: WebauthnModule["requestListPasskeyAuthorization"];
}
