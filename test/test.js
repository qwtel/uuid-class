import assert from 'assert';

// For node only, include a crypto polyfill
import '../node-polyfill.js';
import { UUID } from '../index.js'

const RE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

const u = new UUID();
assert.ok(u);
assert.ok(u instanceof Uint8Array);
assert.equal(u.length, 16);
assert.equal(u.byteLength, 16);
assert.ok(RE_UUID.test(u));
assert.ok(RE_UUID.test(u.toString()));
assert.ok(RE_UUID.test(u.uuid));
assert.ok(RE_UUID.test(u.toJSON()));

// Can be created from other uuid
const uu = new UUID(u)
assert.ok(uu);
assert.equal(uu.uuid, u.uuid);

// Has static v4 factory function
const v = UUID.v4();
assert.ok(v);
assert.ok(RE_UUID.test(v));

// Can be created from a buffer
const b = new UUID(u.buffer);
assert.ok(b);
assert.ok(RE_UUID.test(b));
assert.equal(b.uuid, u.uuid);

// Can be created from an UUID string and accessed byte by byte
const s = new UUID('95fb587f-4911-4aeb-b6bb-464b2b617e2c');
assert.ok(s)
assert.equal(s.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
assert.equal(s[0], 0x95);
assert.equal(s[1], 0xfb);
assert.equal(s[2], 0x58);
assert.equal(s[3], 0x7f);
assert.equal(s[15], 0x2c);

// Stringifies to a regular UUID string
assert.equal(JSON.stringify({ s }), `{"s":"95fb587f-4911-4aeb-b6bb-464b2b617e2c"}`);

// Parses any hex string
const t = new UUID('95fb587f49114aebb6bb464b2b617e2c');
assert.ok(t);
assert.equal(t.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');

// Throws when too little data is provided
assert.throws(() => new UUID('95fb587f-'));
assert.throws(() => new UUID([0x95, 0xfb, 0x58, 0x75]));
assert.throws(() => new UUID(new Uint8Array([0x95, 0xfb, 0x58, 0x75])));
assert.throws(() => new UUID(new Uint8Array([0x95, 0xfb, 0x58, 0x75]).buffer));

// The stringified format of other typed arrays is not supported (same as other typed arry constructors)
const stringified = JSON.parse(JSON.stringify(new Uint8Array(u.buffer)));
assert.throws(() => new UUID(stringified));
// Works when treating it with `Object.values` first (but order isn't guaranteed, I think)
assert.equal(new UUID(Object.values(stringified)).uuid, u.uuid)

// Accepts longer strings, sheds extra data
const a = new UUID('95fb587f49114aebb6bb464b2b617e2c6593210206284c1394dd331c2ca42107');
assert.ok(a);
assert.equal(a.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
assert.equal(a.byteLength, 16);
assert.equal(a.length, 16);

// Also accepts more than 16 bytes, will discard the rest
const r = crypto.getRandomValues(new Uint8Array(18));
const c = new UUID(r);
assert.equal(c.byteLength, 16);
assert.equal(c.length, 16);
assert.equal(c[16], undefined);
assert.equal(c[17], undefined);
assert.equal(c.buffer.byteLength, 16);
const d = new UUID(r.slice(0, 16));
assert.equal(c.uuid, d.uuid);

// The behavior for creating the UUID from 16, 32, 64-bit arrays is odd, but in line with how it works for other typed arrays. 
// Higher-order bits get truncated:
const u16 = new Uint16Array([0xff95, 0x8cfb, 0x58, 0x7f, 0x49, 0x11, 0x4a, 0xeb, 0xb6, 0xbb, 0x46, 0x4b, 0x2b, 0x61, 0x7e, 0x2c]);
const g = new UUID(u16);
assert.equal(g[0], 0x95);
assert.equal(g[1], 0xfb);
assert.equal(g.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');

// When passing the array buffer all bits are used, but mind the endianness:
const h = new UUID(u16.buffer);
assert.equal(h[0], 0x95);
assert.equal(h[1], 0xff);
assert.equal(h[2], 0xfb);
assert.equal(h[3], 0x8c);

