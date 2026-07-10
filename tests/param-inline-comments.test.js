const path = require('path');
const fs = require('fs');
const { RuleTester } = require('eslint');
const rule = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tests/tsconfig.json',
  },
});

function getFixturePath(name) {
    return path.join(__dirname, 'fixtures', name);
}

function getFixtureContent(name) {
    return fs.readFileSync(getFixturePath(name), 'utf8');
}

function getExpectedMsg(paramName, value) {
  return `Value '${value}' should have an inline comment /* ${paramName} */`;
}

describe('param-inline-comments', () => {
  ruleTester.run('param-inline-comments', rule, {
    valid: [
      // Baseline: single-arg calls, defaulted params, already-commented args.
      'valid-1.js',
      'valid-2.js',
      'valid-3.js',
      'valid-4.js',
      'valid-5.js',
      'valid-6.js',
      // Real-world regression guards — these MUST stay silent. Reporting on
      // them would make `--fix` insert wrong/misleading comments into code.
      //
      // .bind()/.call()/.apply(): getResolvedSignature returns
      // Function.prototype's own (thisArg, ...args) signature, not the target's
      // params, so any comment we produced here would be factually wrong.
      'valid-7.js', // fn.bind(null, 1, true)
      'valid-8.js', // fn.call(null, 'hi', true)
      'valid-15.js', // fn.apply(null, [1, true])
      // A user method literally named `call` must not get the bind/call offset.
      'valid-9.js', // new Rpc().call(3, true)
      // Namespaced built-ins: skip cheaply, don't report lib.d.ts param names.
      'valid-10.js', // console.log('tag', 1, true)
      'valid-11.js', // JSON.stringify(o, null, 2)
      'valid-12.js', // Math.max(3, 0)
      // No bare-literal arguments -> nothing to flag.
      'valid-13.js', // f(x, 'z')
      // Identifier system call (setTimeout) is skipped.
      'valid-14.js', // setTimeout(cb, 1000)
    ].map(file => ({
        code: getFixtureContent(file),
        filename: getFixturePath(file),
    })),
    invalid: [
      {
        code: getFixtureContent('invalid-1.js'),
        filename: getFixturePath('invalid-1.js'),
        errors: [{ message: getExpectedMsg('bool', false) }],
        output: "function test_invalid_1(num, bool) {}; test_invalid_1(/* num */ 1, /* bool */ false);",
      },
      {
        code: getFixtureContent('invalid-2.js'),
        filename: getFixturePath('invalid-2.js'),
        errors: [{ message: getExpectedMsg('num', 1) }],
        output: "function test_invalid_2(num, bool) {}; test_invalid_2(/* num */ 1, /* bool */ false);",
      },
      {
        code: getFixtureContent('invalid-3.js'),
        filename: getFixturePath('invalid-3.js'),
        errors: [
            { message: getExpectedMsg('num', 1) },
            { message: getExpectedMsg('bool', false) },
        ],
        output: "function test_invalid_3(num, bool) {}; test_invalid_3(/* num */ 1, /* bool */ false);",
      },
      {
        code: getFixtureContent('invalid-4.js'),
        filename: getFixturePath('invalid-4.js'),
        errors: [
            { message: getExpectedMsg('num', 1) },
            { message: getExpectedMsg('obj', null) },
        ],
        output: "function test_invalid_4(num, obj) {}; test_invalid_4(/* num */ 1, /* obj */ null);",
      },
      // Member call on a plain user object still resolves to the real params.
      {
        code: getFixtureContent('invalid-5.js'),
        filename: getFixturePath('invalid-5.js'),
        errors: [
            { message: getExpectedMsg('b', 1) },
            { message: getExpectedMsg('c', true) },
        ],
        output: "const svc = { method(a, b, c) { return a; } }; svc.method('x', /* b */ 1, /* c */ true);",
      },
      // Realistic call: string arg skipped, boolean + number flagged with names.
      {
        code: getFixtureContent('invalid-6.js'),
        filename: getFixturePath('invalid-6.js'),
        errors: [
            { message: getExpectedMsg('isAdmin', true) },
            { message: getExpectedMsg('age', 30) },
        ],
        output: "function createUser(name, isAdmin, age) {}; createUser('bob', /* isAdmin */ true, /* age */ 30);",
      },
      // The literal 0 (falsy) must still be flagged.
      {
        code: getFixtureContent('invalid-7.js'),
        filename: getFixturePath('invalid-7.js'),
        errors: [
            { message: getExpectedMsg('index', 0) },
            { message: getExpectedMsg('enabled', true) },
        ],
        output: "function toggle(index, enabled) {}; toggle(/* index */ 0, /* enabled */ true);",
      },
    ],
  });
});