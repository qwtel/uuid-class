import { bufferSourceToUint8Array, bytesToHexArray, concatUint8Arrays, hexStringToBytes } from 'typed-array-utils';

// Better inspection for node and deno.
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');

// @ts-ignore
const denoInspect: symbol = typeof Deno !== 'undefined'
  // @ts-ignore
  ? 'symbols' in Deno ? Deno.symbols.customInspect : Deno.customInspect
  : Symbol();


function _bytesToUUIDString(uint8Array: Uint8Array) {
  const hexArray = bytesToHexArray(uint8Array);
  hexArray.splice(4, 0, '-')
  hexArray.splice(7, 0, '-')
  hexArray.splice(10, 0, '-')
  hexArray.splice(13, 0, '-')
  return hexArray.join('');
}

function _v4() {
  const uuid = crypto.getRandomValues(new Uint8Array(16));

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  uuid[6] = (uuid[6] & 0x0f) | 0x40;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;

  return uuid.buffer;
}

function _fromString(str: string) {
  const hex = str.replace(/[^0-9a-f]/gi, '').slice(0, 32);
  if (hex.length < 32) throw Error('UUID too short');
  return hexStringToBytes(hex);
}

function stringToBytes(str: string) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape
  return new TextEncoder().encode(str);
}

async function _v5(value: string | BufferSource, namespace: string | UUID) {
  const valueBytes = typeof value === 'string'
    ? stringToBytes(value)
    : bufferSourceToUint8Array(value);

  const namespaceUUID = typeof namespace === 'string'
    ? new UUID(namespace)
    : namespace

  const hashBytes = await crypto.subtle.digest('SHA-1', concatUint8Arrays(namespaceUUID, valueBytes));

  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // version
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80;

  return hashBytes.slice(0, 16);
}

/**
 * A better UUID class for JavaScript.
 * 
 * UUID are represented as bytes (`Uint8Array`) and converted to strings on-demand.
 * 
 * This class implements `toString` and `toJSON` for better language integration,
 * as well as inspection for node and Deno for a better development experience.
 * 
 * For the most part, `UUID` can be used where  UUID strings are used,
 * except for equality checks. For those cases, `UUID` provides quick access 
 * to the string representations via the `id` field.
 */
export class UUID extends Uint8Array {
  /**
   * Generate a new UUID version 4 (random).
   * 
   * __Note that `crypto.getRandomValues` needs to be available in the global JS object!__
   */
  static v4() {
    return new UUID(_v4());
  }

  /**
   * Generated a new UUID version 5 (hashed)
   * 
   * __Note that `crypto.subtle` needs to be available in the global JS object (Not the case on non-HTTPS sites)!__
   * 
   * @param value 
   * @param namespace 
   */
  static async v5(value: string | BufferSource, namespace: string | UUID) {
    return new UUID(await _v5(value, namespace));
  }

  /**
   * Generate a new UUID version 4 (random).
   * 
   * __Note that `crypto.getRandomValues` needs to be available in the global JS object!__
   */
  constructor();
  /**
   * Creates a new UUID object from the provided string, which must be a valid UUID string.
   */
  constructor(value: string);
  /**
   * Creates a copy of the provided UUID
   */
  constructor(value: UUID);
  /**
   * Create a UUID from the provided iterable, where every value will be interpreted as a unsigned 8 bit integer.
   */
  constructor(value: Iterable<number>);
  /**
   * Create a new UUID from the provided array-like structure.
   */
  constructor(value: ArrayLike<number> | ArrayBuffer | SharedArrayBuffer);
  /**
   * Creates a UUID from the arry buffer using 16 bytes started from the provided offset.
   */
  constructor(value: ArrayBufferLike, byteOffset: number);
  constructor(value?: any, byteOffset?: number) {
    if (value == null) {
      super(new Uint8Array(_v4()));
    } else if (typeof value === 'string') {
      super(new Uint8Array(_fromString(value)));
    } else if (value instanceof UUID) {
      super(new Uint8Array(value.buffer));
    } else {
      const x = new Uint8Array(value, byteOffset, 16).slice(0, 16);
      if (x.length < 16) throw Error('UUID too short')
      super(x.buffer);
    }
  }

  /**
   * Quick access to the string representation for easier comparison.
   * @example if (myUUID.id === otherUUID.id) { ... }
   */
  get id() {
    return _bytesToUUIDString(this);
  }

  /**
   * Quick access to the UUID string representation for easier comparison.
   * @example if (myUUID.uuid === otherUUID.uuid) { ... }
   */
  get uuid() {
    return _bytesToUUIDString(this);
  }

  toString() {
    return _bytesToUUIDString(this);
  }

  toJSON() {
    return _bytesToUUIDString(this);
  }

  [nodeInspect]() {
    return `UUID [ ${this.uuid} ]`;
  }

  [denoInspect]() {
    return `UUID [ ${this.uuid} ]`;
  }
}