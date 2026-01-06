import { fromPointer } from "objc-js";
import { createPresentationContextProvider } from "../objc/authentication-services/as-authorization-controller-presentation-context-providing.js";
import type { _NSView } from "../objc/foundation/nsview.js";

/**
 * Create a presentation context provider from a native window handle.
 * @param nativeWindowHandle - The native window handle.
 * @returns The presentation context provider.
 */
export function createPresentationContextProviderFromNativeWindowHandle(
  nativeWindowHandle: Buffer
) {
  const presentationContextProvider = createPresentationContextProvider({
    presentationAnchorForAuthorizationController: () => {
      // Return the NSWindow to present the authorization UI in
      const nsView = fromPointer(nativeWindowHandle) as unknown as _NSView;
      const nsWindow = nsView.window();
      return nsWindow;
    },
  });
  return presentationContextProvider;
}
