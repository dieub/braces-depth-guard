'use strict';
const assert = require('assert').strict;
const braces = require('..');
describe('maxLength parsing option boundary', () => {
  it('rejects NaN and negative numeric limits before processing', () => {
    for (const maxLength of [NaN, -1, -0.5, -Infinity, -Number.MIN_VALUE]) {
      assert.throws(() => braces.parse('', {maxLength}), e => e instanceof RangeError && e.message === 'maxLength must be a non-negative number');
      for (const method of ['parse', 'compile', 'stringify', 'expand']) assert.throws(() => braces[method]('abc', {maxLength}), /maxLength must be a non-negative number/);
    }
  });
  it('preserves zero, negative zero and fractional inclusive boundaries', () => {
    for (const maxLength of [0, -0]) {
      assert.doesNotThrow(() => braces.parse('', {maxLength}));
      assert.throws(() => braces.parse('a', {maxLength}), /exceeds max characters/);
    }
    assert.doesNotThrow(() => braces.parse('a', {maxLength: 1.5}));
    assert.throws(() => braces.parse('ab', {maxLength: 1.5}), /exceeds max characters/);
  });
  it('caps positive infinity and larger finite values at10000', () => {
    for (const maxLength of [Infinity, 10000, 10001, Number.MAX_VALUE]) {
      assert.doesNotThrow(() => braces.parse('a'.repeat(10000), {maxLength}));
      assert.throws(() => braces.parse('a'.repeat(10001), {maxLength}), /exceeds max characters \(10000\)/);
    }
  });
  it('preserves nonnumeric defaults without coercion', () => {
    const object = {valueOf() {throw Error('must not coerce')}};
    for (const maxLength of [undefined, null, false, true, '1', '-1', {}, new Number(1), object]) {
      assert.doesNotThrow(() => braces.parse('abc', {maxLength}));
      assert.throws(() => braces.parse('a'.repeat(10001), {maxLength}), /exceeds max characters \(10000\)/);
    }
  });
  it('reads a stateful maxLength once and cannot admit an oversized input', () => {
    let reads = 0;
    const options = {get maxLength() {return ++reads === 1 ? 10 : NaN}};
    assert.throws(() => braces.parse('a'.repeat(10001), options), /exceeds max characters \(10\)/);
    assert.equal(reads, 1);
  });
  it('keeps the documented short-create shortcut limitation explicit', () => {
    assert.deepEqual(braces.create('a', {maxLength: 0}), ['a']);
    assert.throws(() => braces.create('abc', {maxLength: 0}), /exceeds max characters/);
  });
});
