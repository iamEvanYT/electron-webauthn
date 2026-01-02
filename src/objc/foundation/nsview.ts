import { Foundation } from "./index.js";
import type { NobjcObject } from "objc-js";
import type { _NSWindow } from "./nswindow.js";

// Class declaration
export declare class _NSView extends NobjcObject {
  window(): _NSWindow;
}
export const NSView = Foundation.NSView as unknown as typeof _NSView;
