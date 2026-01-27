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
      'valid-1.js',
      'valid-2.js',
      'valid-3.js',
      'valid-4.js',
      'valid-5.js',
      'valid-6.js',
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
    ],
  });
});