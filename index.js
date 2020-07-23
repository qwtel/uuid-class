import './global-this.js';

// Better inspection for node and deno.
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');

// @ts-ignore
const denoInspect = typeof Deno !== 'undefined' 
  // @ts-ignore
  ? 'symbols' in Deno ? Deno.symbols.customInspect : Deno.customInspect 
  : Symbol();

const byteToHex = byte => byte.toString(16).padStart(2, '0');
const hexToByte = hex => parseInt(hex, 16);

const _hexStringToBytes = hex => hex.match(/[0-9A-Za-z]{1,2}/g).map(hexToByte);

function _bytesToHexArray(uint8Array) {
  const hexArray = new Array(16);
  for (let i = 0; i < 16; i++) { hexArray[i] = byteToHex(uint8Array[i]) }
  return hexArray;
}

function _bytesToUUIDString(uint8Array) {
  const hexArray = _bytesToHexArray(uint8Array);
  hexArray.splice( 4, 0, '-');
  hexArray.splice( 7, 0, '-');
  hexArray.splice(10, 0, '-');
  hexArray.splice(13, 0, '-');
  return hexArray.join('');
}

function _v4() {
  const uuid = globalThis.crypto.getRandomValues(new Uint8Array(16));

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  uuid[6] = (uuid[6] & 0x0f) | 0x40;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;

  return uuid.buffer;
}

function _fromString(str) {
  const hex = str.replace(/[^0-9A-Za-z]/g, '').slice(0, 32);
  if (hex.length < 32) throw Error('UUID too short');
  return _hexStringToBytes(hex);
}

 const _uint8Array = new WeakMap();

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
 * to the string representations via the `uuid` field.
 * 
 * @extends ArrayBufferView
 */
export class UUID {
  /**
   * Generate a new UUID version 4 (random).
   */
  static v4() {
    return new UUID(_v4());
  }

  /**
   * @param {string} value 
   */
  static fromString(value) {
    return new UUID(_fromString(value));
  }

  /**
   * @param {string|ArrayLike<number>|ArrayBufferLike} [value] 
   *  Value from which to create this UUID. Leave empty to create a random (v4) UUID
   * @param {number} [byteOffset] 
   *  When `value` is an `ArrayBuffer`, can specify and offset in bytes from where to read.
   */
  constructor(value, byteOffset = 0) {
    if (value == null) {
      _uint8Array.set(this, new Uint8Array(_v4()));
    }
    else if (typeof value === 'string') {
      _uint8Array.set(this, new Uint8Array(_fromString(value)));
    }
    else if (value instanceof UUID) {
      _uint8Array.set(this, new Uint8Array(value.buffer.slice(0)));
    }
    else if (value instanceof ArrayBuffer) {
      if (value.byteLength - byteOffset < 16) throw Error('UUID too short');
      _uint8Array.set(this, new Uint8Array(value.slice(byteOffset, byteOffset + 16)));
    }
    else if ('length' in value) {
      const { length } = value;
      if (length < 16) throw Error('UUID too short');
      if (length === 16) _uint8Array.set(this, new Uint8Array(value));
      else if ('slice' in value) _uint8Array.set(this, new Uint8Array(value.slice(0, 16)));
      else _uint8Array.set(this, new Uint8Array(Array.prototype.slice.call(value, 0, 16)));
    }
    else {
      throw Error('Unsupported data type');
    }
  }

  /**
   * @returns {ArrayBufferLike}
   */
  get buffer() {
    return _uint8Array.get(this).buffer;
  }

  /**
   * @returns {number}
   */
  get byteLength() {
    return 16;
  }

  /**
   * @returns {number}
   */
  get byteOffset() {
    return 0;
  }

  /**
   * Quick access to the string representation for easier comparison.
   * Too bad JS doesn't support value types...
   * @example if (myUUID.uuid === otherUUID.uuid) { ... }
   */
  get uuid() {
    return _bytesToUUIDString(_uint8Array.get(this));
  }

  toString() {
    return _bytesToUUIDString(_uint8Array.get(this));
  }

  toJSON() {
    return _bytesToUUIDString(_uint8Array.get(this));
  }

  [nodeInspect]() {
    return `UUID [ ${this.uuid} ]`;
  }

  [denoInspect]() {
    return `UUID [ ${this.uuid} ]`;
  }
}
