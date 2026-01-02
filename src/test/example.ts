import { NSData } from "../objc/foundation/nsdata.js";
import { NSString } from "../objc/foundation/nsstring.js";
import { NSArray } from "../objc/foundation/nsarray.js";

const myString = NSString.stringWithUTF8String$("Hello from Objective-C!");
console.log("Created NSString:", myString);

const buf = Buffer.from("Hello from Objective-C!");
const myData = NSData.dataWithBytes$length$(buf, buf.length);
console.log("Created NSData:", myData);

// Test NSArray
const str1 = NSString.stringWithUTF8String$("First");
const str2 = NSString.stringWithUTF8String$("Second");
const str3 = NSString.stringWithUTF8String$("Third");

// Create array with one object, then add more
let myArray = NSArray.arrayWithObject$(str1);
myArray = myArray.arrayByAddingObject$(str2);
myArray = myArray.arrayByAddingObject$(str3);

console.log("Created NSArray with count:", myArray.count());

// Access elements
for (let i = 0; i < myArray.count(); i++) {
  const obj = myArray.objectAtIndex$(i) as any;
  const nsString = obj as typeof str1;
  console.log(`Array[${i}]:`, nsString.UTF8String());
}
