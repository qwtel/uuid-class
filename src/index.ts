// Better inspection for node and deno.
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');

// @ts-ignore
const denoInspect = typeof Deno !== 'undefined' 
  // @ts-ignore
  ? 'symbols' in Deno ? Deno.symbols.customInspect : Deno.customInspect 
  : Symbol();

const byteToHex = (byte: number) => byte.toString(16).padStart(2, '0');
const hexToByte = (hexOctet: string) => parseInt(hexOctet, 16);

const _hexStringToBytes = (hexString: string) => hexString.match(/[0-9A-Fa-f]{1,2}/g).map(hexToByte);

function _bytesToHexArray(uint8Array: Uint8Array) {
  const hexArray = new Array(16);
  for (let i = 0; i < 16; i++) { hexArray[i] = byteToHex(uint8Array[i]) }
  return hexArray;
}

function _bytesToUUIDString(uint8Array: Uint8Array) {
  const hexArray = _bytesToHexArray(uint8Array);
  hexArray.splice( 4, 0, '-');
  hexArray.splice( 7, 0, '-');
  hexArray.splice(10, 0, '-');
  hexArray.splice(13, 0, '-');
  return hexArray.join('');
}

function _concatArrayBuffers(...abs: ArrayBuffer[]) {
  const u8s = abs.map(a => new Uint8Array(a));
  const size = u8s.reduce((size, u8) => size + u8.length, 0);
  const res = new Uint8Array(size);
  let i = 0;
  for (const u8 of u8s) {
    res.set(u8, i);
    i += u8.length;
  }
  return res.buffer;
}

function _v4() {
  const uuid = crypto.getRandomValues(new Uint8Array(16));

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  uuid[6] = (uuid[6] & 0x0f) | 0x40;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;

  return uuid.buffer;
}

function _fromString(str: string) {
  const hex = str.replace(/[^0-9A-Fa-f]/g, '').slice(0, 32);
  if (hex.length < 32) throw Error('UUID too short');
  return _hexStringToBytes(hex);
}

const _uint8Array = new WeakMap<UUID, Uint8Array>();
const _byteOffset = new WeakMap<UUID, number>();

function stringToBytes(str: string) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape
  return new TextEncoder().encode(str).buffer;
}

async function _v5(value: string|BufferSource, namespace: string|UUID) {
  const valueBytes = typeof value === 'string'
    ? stringToBytes(value)
    : value instanceof ArrayBuffer
      ? value 
      : value.buffer;

  const namespaceUUID = typeof namespace === 'string'
    ? new UUID(namespace)
    : namespace

  
  const hashBytes = await crypto.subtle.digest('SHA-1', _concatArrayBuffers(namespaceUUID.buffer, valueBytes));

  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // version
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80;

  return hashBytes;
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
export class UUID implements ArrayBufferView {
  /**
   * Generate a new UUID version 4 (random).
   */
  static v4() {
    return new UUID(_v4());
  }

  static async v5(value: string|BufferSource, namespace: string|UUID) {
    return new UUID(await _v5(value, namespace));
  }

  /**
   * Create a new random (v4) UUID.
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
   * 
   */
  constructor(value: Iterable<number>);
  /**
   * Create a new UUID from the provided array-like structure.
   */
  constructor(value: ArrayLike<number>|ArrayBuffer|SharedArrayBuffer);
  /**
   * 
   */
  constructor(value: ArrayBufferLike, byteOffset: number);
  constructor(value?: any, byteOffset: number = 0) {
    if (value == null) {
      _uint8Array.set(this, new Uint8Array(_v4()));
      _byteOffset.set(this, 0);
    }
    else if (typeof value === 'string') {
      _uint8Array.set(this, new Uint8Array(_fromString(value)));
      _byteOffset.set(this, 0);
    }
    else if (value instanceof UUID) {
      _uint8Array.set(this, new Uint8Array(value.buffer));
      _byteOffset.set(this, value.byteOffset);
    }
    else if (typeof value[Symbol.iterator] === 'function') {
      if (typeof value.length === 'number') {
        if (value.length < 16) throw Error('UUID too short')
      } else {
        const iter = (value as Iterable<number>)[Symbol.iterator]();
        for (let i = 0; i < 16; i++) if (iter.next().done) throw Error('UUID too short');
      }
      _uint8Array.set(this, new Uint8Array(value));
      _byteOffset.set(this, 0);
    }
    else if (value instanceof ArrayBuffer && byteOffset > 0) {
      if (value.byteLength - byteOffset < 16) throw Error('UUID too short');
      _uint8Array.set(this, new Uint8Array(value, byteOffset, byteOffset + 16));
      _byteOffset.set(this, byteOffset);
    }
    else if ('length' in value) {
      const v = value as ArrayLike<number>
      if (v.length < 16) throw Error('UUID too short');
      _uint8Array.set(this, new Uint8Array(v));
    }
    else {
      throw Error('Unsupported data type');
    }
  }

  /**
   * The ArrayBuffer instance referenced by the array.
   */
  get buffer() {
    return _uint8Array.get(this).buffer;
  }

  /**
   * The length in bytes of the array.
   */
  get byteLength() {
    return 16;
  }

  /**
   * The offset in bytes of the array.
   */
  get byteOffset() {
    return 0;
  }

  /**
   * Quick access to the string representation for easier comparison.
   * @example if (myUUID.id === otherUUID.id) { ... }
   */
  get id() {
    return _bytesToUUIDString(_uint8Array.get(this));
  }

  /**
   * Quick access to the string representation for easier comparison.
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
