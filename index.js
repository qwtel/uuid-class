// Better inspection for node and deno.
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');
const denoInspect = typeof Deno !== 'undefined' ? 'symbols' in Deno ? Deno.symbols.customInspect : Deno.customInspect : Symbol();

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
  const uuid = crypto.getRandomValues(new Uint8Array(16));

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

/** 
 * @typedef {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} TypedArray
 */

/**
 * A better UUID class for JavaScript.
 * 
 * UUID are represented as bytes (`Uint8Array`) and converted to strings on-demand.
 * 
 * This class implements `toString` and `toJSON` for better language integration,
 * as well as inspection for node and Deno for a better development experience.
 * For the most part, `UUID` can be used where  UUID strings are used,
 * except for equality checks. For those cases, `UUID` provides quick access 
 * to the string representations via the `uuid` field.
 */
export class UUID extends Uint8Array {
  /**
   * Generate a new UUID version 4 (random).
   */
  static v4() {
    return new UUID(_v4());
  }

  /**
   * 
   * @param {string} value 
   */
  static fromString(value) {
    return new UUID(_fromString(value));
  }

  /**
   * @param {string|number|ArrayLike<number>|ArrayBuffer|TypedArray} [value] 
   * @param {number} [byteOffset] When `value` is an `ArrayBuffer`, can specify and offset in bytes from where to read.
   */
  constructor(value, byteOffset) {
    if (value == null) {
      super(_v4());
    } else if (typeof value === 'string') {
      super(_fromString(value))
    } else if (typeof value === 'number') {
      super(16); // NOTE: Accepts a number, but length is always 16 bytes.
    } else if (value instanceof ArrayBuffer) {
      if (value.byteLength - (byteOffset || 0) < 16) throw Error('UUID too short');
      super(value, byteOffset, 16);
    } else if ('length' in value) {
      const { length } = value;
      if (length < 16) throw Error('UUID too short');
      if (length === 16) super(value);
      else super(Array.prototype.slice.call(value, 0, 16));
    } else {
      throw Error('Unsupported data type');
    }
  }

  /**
   * Quick access to the string representation for easier comparison.
   * Too bad JS doesn't support value types...
   * @example if (myUUID.id === otherUUID.id) { ... }
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

