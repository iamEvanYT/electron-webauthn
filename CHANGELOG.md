# Changelog

## [1.3.1] - 2026-04-06

- chore: bump dependencies.
- fix: use block wrappers for `platformCredentialsForRelyingParty$completionHandler$` and `requestAuthorizationForPublicKeyCredentials$` to improve reliability.

## [1.3.0] - 2026-04-06

- feat: add `getListPasskeyAuthorizationStatus` and `requestListPasskeyAuthorization` utilities.
- chore: bump dependencies

## [1.2.0] - 2026-02-25

- fix: split package into cross-platform `electron-webauthn` shim + darwin-only `@electron-webauthn/macos` implementation to prevent Linux/Bun/electron-builder packaging failures from macOS native dependencies.

## [1.1.1] - 2026-02-22

- feat: added `listPasskeys` function.

## [1.0.5] - 2026-01-14

- bump: update `objc-js` to `v1.0.4`.

## [1.0.4] - 2026-01-14

- bump: update `objc-js` to `v1.0.3`.

## [1.0.3] - 2026-01-14

- bump: update `objc-js` to `v1.0.2`.
