import { NobjcLibrary } from "objc-js";

// Load the framework
export const AuthenticationServices = new NobjcLibrary(
  "/System/Library/Frameworks/AuthenticationServices.framework/AuthenticationServices"
);
