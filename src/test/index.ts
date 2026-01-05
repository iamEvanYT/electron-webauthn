import { getPointer } from "objc-js";
import { createEmptyWindow, getNativeWindowHandle } from "./window.js";
import { getCredential } from "../index.js";

const window = createEmptyWindow();
const nsView = getNativeWindowHandle(window);
const nsViewPointer = getPointer(nsView);

const result = getCredential(
  "example.com",
  Buffer.from("challenge"),
  nsViewPointer,
  "https://example.com",
  [],
  []
);
console.log("Result:", result);
