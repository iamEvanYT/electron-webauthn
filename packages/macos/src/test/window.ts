import { CGRect, createDelegate } from "objcjs-types";
import {
  NSApplication,
  NSWindow,
  NSWindowStyleMask,
  type _NSWindow,
} from "objcjs-types/AppKit";
import { NSDate, NSRunLoop } from "objcjs-types/Foundation";
import { options } from "objcjs-types/helpers";

function createEmptyWindow() {
  const NSApp = NSApplication.sharedApplication();
  const window = NSWindow.alloc().init();
  const styleMask = options(
    NSWindowStyleMask.Titled,
    NSWindowStyleMask.Closable,
    NSWindowStyleMask.Miniaturizable,
    NSWindowStyleMask.Resizable
  );

  // Make the app active and show the window.
  window.setStyleMask$(styleMask);
  window.setFrame$display$(CGRect(100, 100, 800, 600), true);
  // window.setFrameFromString$(NSStringFromString("{{100, 100}, {800, 600}}"));
  NSApp.setActivationPolicy$(0);
  NSApp.finishLaunching();
  NSApp.activate();
  // NSApp.activateIgnoringOtherApps$(true);
  window.setIsVisible$(true);
  window.makeKeyWindow();
  window.orderFrontRegardless();

  const delegate = createDelegate("NSWindowDelegate", {
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
  const runLoop = NSRunLoop.currentRunLoop();
  const pump = () => {
    const untilDate = NSDate.dateWithTimeIntervalSinceNow$(0.01);
    runLoop.runUntilDate$(untilDate);
  };
  const pumpId = setInterval(pump, 10);
  process.once("exit", () => clearInterval(pumpId));

  return window;
}

function getNativeWindowHandle(window: _NSWindow) {
  // Electron expects an NSView* on macOS; contentView returns that NSView.
  return window.contentView();
}

export { createEmptyWindow, getNativeWindowHandle };
