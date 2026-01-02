import { NobjcLibrary } from "objc-js";

// Load the framework
export const Foundation = new NobjcLibrary(
  "/System/Library/Frameworks/Foundation.framework/Foundation"
);
