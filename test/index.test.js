
import 'https://gist.githubusercontent.com/qwtel/b14f0f81e3a96189f7771f83ee113f64/raw/TestRequest.ts'
import {
  assert,
  assertExists,
  assertEquals,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  assertRejects,
  assertArrayIncludes,
} from 'https://deno.land/std@0.133.0/testing/asserts.ts'
const { test } = Deno;

import { UUID } from '../index.ts'

const RE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test('basics', () => {
  const u = new UUID();
  assertExists(u);
  assert(u instanceof Uint8Array);
  assert(u.buffer instanceof ArrayBuffer);
  assertEquals(u.byteLength, 16);
  assert(RE_UUID.test(u));
  assert(RE_UUID.test(u.toString()));
  assert(RE_UUID.test(u.uuid));
  assert(RE_UUID.test(u.toJSON()));
})

test('can be created from other uuid', () => {
  const u = new UUID();
  const uu = new UUID(u)
  assertExists(uu);
  assertEquals(uu.uuid, u.uuid);
})

test('has static v4 factory function', () => {
  const v = UUID.v4();
  assertExists(v);
  assert(RE_UUID.test(v));
})

test('can be created from a buffer', () => {
  const u = new UUID();
  const b = new UUID(u.buffer);
  assert(b);
  assert(RE_UUID.test(b));
  assertEquals(b.uuid, u.uuid);
})

test('can be created from an UUID string and accessed byte by byte', () => {
  const s = new UUID('95fb587f-4911-4aeb-b6bb-464b2b617e2c');
  assertExists(s)
  assertEquals(s.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
  const sb = new Uint8Array(s.buffer);
  assertEquals(sb[0], 0x95);
  assertEquals(sb[1], 0xfb);
  assertEquals(sb[2], 0x58);
  assertEquals(sb[3], 0x7f);
  assertEquals(sb[15], 0x2c);
})

test('stringifies to a regular UUID string', () => {
  const s = new UUID('95fb587f-4911-4aeb-b6bb-464b2b617e2c');
  assertEquals(JSON.stringify({ s }), `{"s":"95fb587f-4911-4aeb-b6bb-464b2b617e2c"}`);
})

test('parses any hex string', () => {
  const t = new UUID('95fb587f49114aebb6bb464b2b617e2c');
  assertExists(t);
  assertEquals(t.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
})

test('throws when too little data is provided', () => {
  assertThrows(() => new UUID('95fb587f-'));
  assertThrows(() => new UUID([0x95, 0xfb, 0x58, 0x75]));
  assertThrows(() => new UUID(new Uint8Array([0x95, 0xfb, 0x58, 0x75])));
  assertThrows(() => new UUID(new Uint8Array([0x95, 0xfb, 0x58, 0x75]).buffer));
})

test('the stringified format of other typed arrays is not supported (same as other typed array constructors', () => {
  const u = new UUID();
  const stringified = JSON.parse(JSON.stringify(new Uint8Array(u.buffer)));
  assertThrows(() => new UUID(stringified));
  // Works when treating it with `Object.values` first (but order isn't guaranteed, I think)
  assertEquals(new UUID(Object.values(stringified)).uuid, u.uuid)
})


test('accepts longer strings, sheds extra data', () => {
  const a = new UUID('95fb587f49114aebb6bb464b2b617e2c6593210206284c1394dd331c2ca42107');
  assertExists(a);
  assertEquals(a.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
  assertEquals(a.byteLength, 16);
  assertEquals(a.length, 16);
})

test('also accepts more than 16 bytes, will discard the rest', () => {
  const r = crypto.getRandomValues(new Uint8Array(18));
  const c = new UUID(r);
  assertEquals(c.byteLength, 16);
  assertEquals(c.buffer.byteLength, 16);
  
  const cb = new Uint8Array(c.buffer);
  assertEquals(cb.length, 16);
  assertEquals(cb[16], undefined);
  assertEquals(cb[17], undefined);
  assertEquals(cb.buffer.byteLength, 16);

  const d = new UUID(r.slice(0, 16));
  assertEquals(c.uuid, d.uuid);
})

// The behavior for creating the UUID from 16, 32, 64-bit arrays is odd, but in line with how it works for other typed arrays. 

test('higher-order bits get truncated', () => {
  const u16 = new Uint16Array([0xff95, 0x8cfb, 0x58, 0x7f, 0x49, 0x11, 0x4a, 0xeb, 0xb6, 0xbb, 0x46, 0x4b, 0x2b, 0x61, 0x7e, 0x2c]);
  const g = new UUID(u16);
  assertEquals(g.uuid, '95fb587f-4911-4aeb-b6bb-464b2b617e2c');
  const gb = new Uint8Array(g.buffer);
  assertEquals(gb[0], 0x95);
  assertEquals(gb[1], 0xfb);
})

test('when passing the array buffer all bits are used, but mind the endianness', () => {
  const u16 = new Uint16Array([0xff95, 0x8cfb, 0x58, 0x7f, 0x49, 0x11, 0x4a, 0xeb, 0xb6, 0xbb, 0x46, 0x4b, 0x2b, 0x61, 0x7e, 0x2c]);
  const h = new UUID(u16.buffer);
  const hb = new Uint8Array(h.buffer);
  assertEquals(hb[0], 0x95);
  assertEquals(hb[1], 0xff);
  assertEquals(hb[2], 0xfb);
  assertEquals(hb[3], 0x8c);
})
