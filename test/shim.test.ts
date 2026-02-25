import { afterEach, describe, expect, test } from "bun:test";
import {
  __setMacosLoaderForTesting,
  __setPlatformForTesting,
  createCredential,
  getCredential,
  listPasskeys,
} from "../src/index";

afterEach(() => {
  __setPlatformForTesting(null);
  __setMacosLoaderForTesting(null);
});

describe("electron-webauthn shim", () => {
  test("loads on linux without macOS package", async () => {
    __setPlatformForTesting("linux");
    __setMacosLoaderForTesting(async () => {
      throw new Error("loader should not run on linux");
    });

    const list = await listPasskeys("example.com");
    expect(list.success).toBe(false);

    const create = await createCredential(undefined, {
      currentOrigin: "https://example.com",
      topFrameOrigin: undefined,
      nativeWindowHandle: Buffer.alloc(0),
    });
    expect(create.success).toBe(false);

    const get = await getCredential(undefined, {
      currentOrigin: "https://example.com",
      topFrameOrigin: undefined,
      nativeWindowHandle: Buffer.alloc(0),
    });
    expect(get.success).toBe(false);
  });

  test("darwin path attempts macOS module load", async () => {
    let loadCount = 0;

    __setPlatformForTesting("darwin");
    __setMacosLoaderForTesting(async () => {
      loadCount += 1;
      return {
        async createCredential() {
          return { success: false, error: "NotAllowedError" as const };
        },
        async getCredential() {
          return { success: false, error: "NotAllowedError" as const };
        },
        async listPasskeys() {
          return { success: true, credentials: [] };
        },
      };
    });

    const first = await listPasskeys("example.com");
    const second = await listPasskeys("example.com");

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(loadCount).toBe(1);
  });
});
