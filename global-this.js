(function (Object) {
  typeof globalThis !== 'object' && (
    this ?
      get() :
      (Object.defineProperty(Object.prototype, '_T_', {
        configurable: true,
        get: get
        // @ts-ignore
      }), _T_)
  );
  function get() {
    this.globalThis = this;
    // @ts-ignore
    delete Object.prototype._T_;
  }
}(Object));