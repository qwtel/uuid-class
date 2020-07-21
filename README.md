# UUID Class

A minimal UUID class for JavaScript.

UUIDs are represented as bytes (`Uint8Array`) and converted to strings on-demand.

This class implements `toString` and `toJSON` for better language integration, as well as inspection for node and Deno for a better development experience.

For the most part, a `UUID` instance can be used where a UUID string is expected, except equality checks. 
For those cases, `UUID` provides quick access to the string representations via the `uuid` field.

## Dependencies
The class is intended to be used in a variety of JS contexts, but expects the WebCryptography API to be implemented, specifically `crypto.getRandomValues`. It also expects `Uint8Array` to be available. 

It is written in ES2015 syntax and ES modules. However, it can be used in node via `require`.
