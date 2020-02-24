import { randomBytes } from 'crypto';

/** 
 * @typedef {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} TypedArray
 */

global.crypto = { 
  /** 
   * A ponyfill for `getRandomValues`.
   * **It does not conform to the WebCrypto specification!**
   * 
   * Unlike a full polyfill, this implementation is faster as it avoids copying data. 
   * But  still be slower than a native implement)
   * 
   * Specifically, the provided typed array is not filled with random values, nor is it returned form the function.
   * Instead a new typed array of the same type and size is returned, which contains the random data.
   * 
   * @param {TypedArray} typedArray A typed array used f
   * @returns {TypedArray} A different
   */
  getRandomValues(typedArray) {
    const { BYTES_PER_ELEMENT, length } = typedArray;
    const totalBytes = BYTES_PER_ELEMENT * length;
    const { buffer } = randomBytes(totalBytes);
    return Reflect.construct(typedArray.constructor, [buffer]);
  }
};
