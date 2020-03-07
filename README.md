# UUID Class

A UUID class for JavaScript.

UUIDs are represented as bytes (`Uint8Array`) and converted to strings on-demand.

This class implements `toString` and `toJSON` for better language integration, as well as inspection for node and Deno for a better development experience.

For the most part, `UUID` can be used where  UUID strings are used,
except for equality checks[^1]. For those cases, `UUID` provides quick access to the string representations via the `uuid` field.

```js
// Create new random UUID
let u = new UUID() = UUID.v4();

assert.ok(u instanceof Uint8Array);
assert.equal(u.length, 16);
assert.equal(u.byteLength, 16);

// Create from UUID string
let s = new UUID('95fb587f-4911-4aeb-b6bb-464b2b617e2c') 
      = UUID.fromString('95fb587f-4911-4aeb-b6bb-464b2b617e2c');

// Can access UUID byte-wise
assert.equal(s[0], 0x95);
assert.equal(s[1], 0xfb);
// ...
assert.equal(s[15], 0x2c);

// Use `uuid` property for equality checks
assert.equal(s.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');

// Stringifies as you would expect
assert.equal(JSON.stringify({ s }), `{"s":"95fb587f-4911-4aeb-b6bb-464b2b617e2c"}`);

// In node and deno prints as the type and the uuid string
console.log(s) // UUID [ 95fb587f-4911-4aeb-b6bb-464b2b617e2c ]
```

[^1]: This is because JavaScript doesn't support value types.
