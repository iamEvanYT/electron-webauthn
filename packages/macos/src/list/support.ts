import {
  formatVersion,
  getOSVersion,
  isAtLeast,
  version,
} from "objcjs-types/osversion";

let listPasskeysSupportOverride: boolean | null = null;

export function ensureListPasskeysSupported() {
  const isSupported =
    listPasskeysSupportOverride === null
      ? isAtLeast(version(13, 3))
      : listPasskeysSupportOverride;

  if (isSupported) {
    return;
  }

  const currentVersion = getOSVersion();
  throw new Error(
    `Passkey listing requires macOS 13.3 or later (current: ${formatVersion(
      currentVersion
    )})`
  );
}

export function __setListPasskeysSupportOverrideForTesting(
  isSupported: boolean | null
) {
  listPasskeysSupportOverride = isSupported;
}
