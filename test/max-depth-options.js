'use strict';
const assert = require('assert').strict;
const braces = require('..');
const methods = ['parse', 'compile', 'stringify', 'expand'];
const nested = n => '{'.repeat(n) + 'a,b' + '}'.repeat(n);
describe('maxDepth option domain', () => {
  for (const method of methods) {
    it(`${method}: explicitly rejects finite negative limits`, () => {
      for (const maxDepth of [-1, -0.5, -Number.MIN_VALUE, -Number.MAX_VALUE]) {
        assert.throws(() => braces[method]('abc', { maxDepth }), e => e instanceof RangeError && e.message === 'maxDepth must be non-negative');
        if (method !== 'parse') assert.throws(() => braces[method](braces.parse('abc'), { maxDepth }), /maxDepth must be non-negative/);
      }
    });
    it(`${method}: zero and negative zero permit only depth zero`, () => {
      for (const maxDepth of [0, -0]) {
        assert.doesNotThrow(() => braces[method]('abc', { maxDepth }));
        assert.throws(() => braces[method](nested(1), { maxDepth }), /exceeds max depth/);
        if (method !== 'parse') assert.doesNotThrow(() => braces[method](braces.parse('abc'), { maxDepth }));
      }
    });
    it(`${method}: preserves fractional and inclusive depth boundaries`, () => {
      assert.doesNotThrow(() => braces[method](nested(1), { maxDepth: 1.5 }));
      assert.throws(() => braces[method](nested(2), { maxDepth: 1.5 }), /exceeds max depth/);
      assert.throws(() => braces[method](nested(1), { maxDepth: 0.5 }), /exceeds max depth/);
      assert.doesNotThrow(() => braces[method](nested(100), { maxDepth: 1000 }));
      assert.throws(() => braces[method](nested(101), { maxDepth: 1000 }), /exceeds max depth/);
    });
    it(`${method}: defaults rather than coerces nonfinite and nonnumeric options`, () => {
      const object = { valueOf() { throw Error('must not coerce'); } };
      for (const maxDepth of [undefined, NaN, Infinity, -Infinity, '1', '-1', true, false, null, {}, new Number(1), object]) {
        assert.doesNotThrow(() => braces[method](nested(2), { maxDepth }));
        assert.throws(() => braces[method](nested(101), { maxDepth }), /exceeds max depth/);
      }
    });
    it(`${method}: snapshots a stateful limit before processing`, () => {
      let reads = 0;
      const options = { get maxDepth() { reads++; return reads === 1 ? 1 : NaN; } };
      const input = method === 'parse' ? nested(2) : braces.parse(nested(2));
      assert.throws(() => braces[method](input, options), /exceeds max depth/);
      assert.equal(reads, 1);
    });
  }
});
