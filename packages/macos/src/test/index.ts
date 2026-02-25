import { getPointer } from "objc-js";
import { createEmptyWindow, getNativeWindowHandle } from "./window.js";
import { getCredentialInternal } from "../get/internal-handler.js";

const window = createEmptyWindow();
const nsView = getNativeWindowHandle(window);
const nsViewPointer = getPointer(nsView);

const result = getCredentialInternal(
  "example.com",
  Buffer.from("challenge"),
  nsViewPointer,
  "https://example.com",
  10 * 1000,
  [],
  []
);
console.log("Result:", result);
