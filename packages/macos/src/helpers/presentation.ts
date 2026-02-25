import { fromPointer } from "objc-js";
import { createDelegate } from "objcjs-types";
import type { _NSView } from "objcjs-types/AppKit";

/**
 * Create a presentation context provider from a native window handle.
 * @param nativeWindowHandle - The native window handle.
 * @returns The presentation context provider.
 */
export function createPresentationContextProviderFromNativeWindowHandle(
  nativeWindowHandle: Buffer
) {
  return createDelegate(
    "ASAuthorizationControllerPresentationContextProviding",
    {
      presentationAnchorForAuthorizationController$: () => {
        const nsView = fromPointer(nativeWindowHandle) as unknown as _NSView;
        const nsWindow = nsView.window();
        return nsWindow;
      },
    }
  );
}
