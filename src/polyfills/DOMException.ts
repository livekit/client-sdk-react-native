/**
 * DOMException is missing in some React Native / JS runtimes but is required by
 * web APIs (e.g. AbortController, fetch) that may be used in livekit-client.
 */
    
// @ts-expect-error: global may not declare DOMException in RN types.
if (typeof global.DOMException === 'undefined') {
  class PolyfillDOMException extends Error {
    readonly code: number;
  
    constructor(message = '', name?: string) {
      super(message);
      this.message = message;
      this.name = name ?? 'Error';
      this.code = 0;
      Object.setPrototypeOf(this, PolyfillDOMException.prototype);
    }
  };
  // @ts-expect-error
  global.DOMException = PolyfillDOMException;
}