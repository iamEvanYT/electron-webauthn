# Changelog

## [1.4.0] - 2026-10-14

- fix: remove the `typescript` peer dependency, which broke installs for projects not on TypeScript 6 and pulled TypeScript into production installs.
- fix(macos): set `clientDataHash` on both platform and security key requests, so security key results verify.
- fix(macos): return the raw authenticator data bytes as `authData` on create instead of a JSON string.
- fix(macos): map native errors by `NSError` code and domain instead of English message text; unrecognised create errors now return `NotAllowedError` instead of crashing.
- fix(macos): return a `TypeError` result instead of `null` when public key options are missing.
- fix(macos): no longer throw on get when only the second PRF result is returned.
- fix(macos): `isString` and `isNumber` now return strict booleans; empty strings and zero are accepted, `NaN` and `Infinity` are rejected.
- fix(macos): reject the promise instead of hanging when a native callback throws, when the ceremony times out, or when configuring the request fails.
- fix(macos): on get, only read `prf` and `largeBlob` results when they were requested, and return `userHandle: null` when the authenticator provides none.
- fix(macos): report a failed large blob write (`written: false`) on get.
- feat: return `authenticatorAttachment` from `createCredential` and `getCredential`.
- fix(macos): report `transports` as `[]` for security keys instead of `["hybrid", "internal"]`.
- chore: bump `objc-js` to 1.6.0, `objcjs-types` to 0.9.0 and `@types/bun` to 1.4.x.
- chore: share a base `tsconfig` between packages and align inter-package dependency ranges.
- ci: add a build and test workflow.

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
