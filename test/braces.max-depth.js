'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');
const compile = require('../lib/compile');
const stringify = require('../lib/stringify');
const expand = require('../lib/expand');

// Walkers receive ASTs from parse() with default options, so only the walker's
// own maxDepth handling is under test here.
const walkers = {
  compile: (ast, options) => compile(ast, options),
  stringify: (ast, options) => stringify(ast, options),
  expand: (ast, options) => expand(ast, options)
};

describe('maxDepth option bounds', () => {
  for (const [name, walk] of Object.entries(walkers)) {
    describe(name, () => {
      it('clamps a negative finite maxDepth to 0 instead of refusing the root', () => {
        for (const maxDepth of [-1, -0.5, -100, -Number.MAX_VALUE]) {
          assert.doesNotThrow(() => walk(parse('abc'), { maxDepth }), `maxDepth ${maxDepth}`);
          assert.throws(() => walk(parse('a{b,c}'), { maxDepth }), /exceeds max depth \(0\)/, `maxDepth ${maxDepth}`);
        }
      });

      it('treats negative zero and zero as depth 0', () => {
        for (const maxDepth of [0, -0]) {
          assert.doesNotThrow(() => walk(parse('abc'), { maxDepth }));
          assert.throws(() => walk(parse('a{b,c}'), { maxDepth }), /exceeds max depth \(0\)/);
        }
      });

      it('compares fractional limits without rounding', () => {
        assert.doesNotThrow(() => walk(parse('a{b,c}'), { maxDepth: 1.5 }));
        assert.throws(() => walk(parse('{{a,b},c}'), { maxDepth: 1.5 }), /exceeds max depth \(1\.5\)/);
        assert.doesNotThrow(() => walk(parse('abc'), { maxDepth: 0.5 }));
        assert.throws(() => walk(parse('a{b,c}'), { maxDepth: 0.5 }), /exceeds max depth \(0\.5\)/);
      });

      it('falls back to the default limit for non-finite values and caps larger ones', () => {
        for (const maxDepth of [undefined, NaN, Infinity, -Infinity, '1', null]) {
          assert.doesNotThrow(() => walk(parse('{{a,b},c}'), { maxDepth }), `maxDepth ${String(maxDepth)}`);
        }
        let deep = { type: 'text', value: 'a' };
        for (let i = 0; i < 102; i++) deep = { type: 'brace', nodes: [deep] };
        assert.throws(() => walk({ type: 'root', nodes: [deep] }, { maxDepth: 1000 }), /exceeds max depth \(100\)/);
      });
    });
  }

  describe('parse', () => {
    it('clamps a negative finite maxDepth to 0', () => {
      for (const maxDepth of [-1, -0.5, -0]) {
        assert.doesNotThrow(() => parse('abc', { maxDepth }));
        assert.throws(() => parse('a{b,c}', { maxDepth }), /exceeds max depth \(0\)/);
        assert.throws(() => parse('(a)', { maxDepth }), /exceeds max depth \(0\)/);
      }
    });
  });
});
