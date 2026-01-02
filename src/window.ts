import { NobjcLibrary, NobjcProtocol, type NobjcObject } from "objc-js";
import { allocInitPlain } from "./objc/helpers.js";
import { NSStringFromString } from "./objc/foundation/nsstring.js";

const AppKit = new NobjcLibrary(
  "/System/Library/Frameworks/AppKit.framework/AppKit"
);
const Foundation = new NobjcLibrary(
  "/System/Library/Frameworks/Foundation.framework/Foundation"
);

function createEmptyWindow(): NobjcObject {
  const NSApp = AppKit.NSApplication.sharedApplication();
  const window = allocInitPlain(AppKit.NSWindow);
  const styleMask = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3); // titled, closable, miniaturizable, resizable

  // Make the app active and show the window.
  window.setStyleMask$(styleMask);
  window.setFrameFromString$(NSStringFromString("{{100, 100}, {800, 600}}"));
  NSApp.setActivationPolicy$(0);
  NSApp.finishLaunching();
  NSApp.activateIgnoringOtherApps$(true);
  window.setIsVisible$(true);
  window.makeKeyWindow();
  window.orderFrontRegardless();

  const delegate = NobjcProtocol.implement("NSWindowDelegate", {
    windowShouldClose$: () => {
      NSApp.terminate$(NSApp);
      return true;
    },
    windowWillClose$: () => {
      NSApp.terminate$(NSApp);
    },
  });
  window.setDelegate$(delegate);

  const shutdown = () => {
    try {
      window.close();
    } finally {
      NSApp.stop$(NSApp);
      NSApp.terminate$(NSApp);
    }
  };

  const handleSignal = () => shutdown();
  process.once("exit", shutdown);
  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);
  process.once("SIGQUIT", handleSignal);

  // Pump the AppKit run loop for a short tick to keep JS responsive.
  const runLoop = Foundation.NSRunLoop.currentRunLoop();
  const pump = () => {
    const untilDate = Foundation.NSDate.dateWithTimeIntervalSinceNow$(0.01);
    runLoop.runUntilDate$(untilDate);
  };
  const pumpId = setInterval(pump, 10);
  process.once("exit", () => clearInterval(pumpId));

  return window;
}

function getNativeWindowHandle(window: NobjcObject): NobjcObject {
  // Electron expects an NSView* on macOS; contentView returns that NSView.
  return window.contentView() as NobjcObject;
}

export { createEmptyWindow, getNativeWindowHandle };
