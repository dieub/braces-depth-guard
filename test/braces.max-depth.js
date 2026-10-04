'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');
const compile = require('../lib/compile');
const stringify = require('../lib/stringify');
const expand = require('../lib/expand');

// Walkers receive ASTs from parse() with default options, so only the walker's
// own maxDepth handling is under test here.
const braces = require('..');

// Values that must never raise or disable the default limit of 100.
const UNGUARDED_VALUES = [undefined, Infinity, NaN, -Infinity, 1000, 1e9, '1000', '1', '-5', null, true, { valueOf: () => 1000 }, BigInt(5)];
const describeValue = value => `maxDepth ${typeof value === 'bigint' ? value + 'n' : typeof value === 'object' && value !== null ? 'object' : String(value)}`;
const nestedBraces = depth => '{'.repeat(depth) + 'a,b' + '}'.repeat(depth);
const nestedParens = depth => '('.repeat(depth) + 'a' + ')'.repeat(depth);

// A root holding `levels` nested brace nodes; the deepest sits at depth `levels`.
const deepTree = levels => {
  let node = { type: 'text', value: 'a' };
  for (let i = 0; i < levels; i++) node = { type: 'brace', nodes: [node] };
  return { type: 'root', nodes: [node] };
};

const walkers = {
  compile: (ast, options) => compile(ast, options),
  stringify: (ast, options) => stringify(ast, options),
  expand: (ast, options) => expand(ast, options),
  'braces.compile': (ast, options) => braces.compile(ast, options),
  'braces.stringify': (ast, options) => braces.stringify(ast, options),
  'braces.expand': (ast, options) => braces.expand(ast, options)
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

      it('keeps the default limit of 100 for every non-finite, non-number or larger value', () => {
        for (const maxDepth of UNGUARDED_VALUES) {
          assert.throws(() => walk(deepTree(102), { maxDepth }), /exceeds max depth \(100\)/, describeValue(maxDepth));
        }
        assert.doesNotThrow(() => walk(parse('{{a,b},c}'), {}));
      });
    });
  }

  const parsers = {
    parse: (input, options) => parse(input, options),
    'braces.parse': (input, options) => braces.parse(input, options),
    braces: (input, options) => braces(input, options),
    'braces.compile': (input, options) => braces.compile(input, options),
    'braces.stringify': (input, options) => braces.stringify(input, options),
    'braces.expand': (input, options) => braces.expand(input, options)
  };

  for (const [name, run] of Object.entries(parsers)) {
    describe(`${name} (string input)`, () => {
      it('clamps a negative finite maxDepth to 0 and treats 0 as depth 0', () => {
        for (const maxDepth of [-1, -0.5, -0, 0]) {
          assert.doesNotThrow(() => run('abc', { maxDepth }), `maxDepth ${maxDepth}`);
          assert.throws(() => run('a{b,c}', { maxDepth }), /exceeds max depth \(0\)/, `maxDepth ${maxDepth}`);
          assert.throws(() => run('(a)', { maxDepth }), /exceeds max depth \(0\)/, `maxDepth ${maxDepth}`);
        }
      });

      it('refuses nesting depth 101 for every non-finite, non-number or larger value', () => {
        for (const maxDepth of UNGUARDED_VALUES) {
          assert.throws(() => run(nestedBraces(101), { maxDepth }), /exceeds max depth \(100\)/, describeValue(maxDepth));
          assert.throws(() => run(nestedParens(101), { maxDepth }), /exceeds max depth \(100\)/, describeValue(maxDepth));
        }
      });
    });
  }

  describe('parse at the limit', () => {
    it('admits depth 100 under the default limit', () => {
      for (const maxDepth of UNGUARDED_VALUES) {
        assert.doesNotThrow(() => parse(nestedBraces(100), { maxDepth }), describeValue(maxDepth));
        assert.doesNotThrow(() => parse(nestedParens(100), { maxDepth }), describeValue(maxDepth));
      }
    });
  });
});
