const { RuleTester } = require('eslint');
const rule = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
});

function getExpectedMsg(paramName, value) {
  return `Value '${value}' should have an inline comment /* ${paramName} */`;
}

describe('param-inline-comments', () => {
  ruleTester.run('param-inline-comments', rule, {
    valid: [
      {
        name: 'should not report when a single argument is present',
        code: 'function test(a) {}; test(1);',
      },
      {
        name: 'should not report when a single argument with default value is present',
        code: 'function test(a, b = false) {}; test(1);',
      },
      {
        name: 'should not report when all arguments have inline comments',
        code: 'function test(a, b = false) {}; test(/* a */ 1, /* b */ true);',
      },
      {
        name: 'should not report when multiple arguments have inline comments',
        code: 'function test(a, b, c) {}; test(/* a */1, /* b */ true, /* c */ false);',
      },
      {
        name: 'should not report when mixed arguments have inline comments',
        code: 'function test(a, b = false, obj) {}; test(/* a */1, /* b */ true, /* obj */ null);',
      },
      {
        name: 'should not report for bind calls with inline comments',
        code: 'function test(a, b) {}; const test2 = test.bind(this, /* a */ 1);',
      },
      // Add more valid code examples
    ],
    invalid: [
      {
        name: 'should report missing comment for boolean argument',
        code: 'function test(num, bool) {}; test(/* num */ 1, false);',
        errors: [
          {
            message: getExpectedMsg('bool', false),
          },
        ],
        output:
          'function test(num, bool) {}; test(/* num */ 1, /* bool */ false);',
      },
      {
        name: 'should report missing comment for number argument',
        code: 'function test(num, bool) {}; test(1, /* bool */ false);',
        errors: [
          {
            message: getExpectedMsg('num', 1),
          },
        ],
        output:
          'function test(num, bool) {}; test(/* num */ 1, /* bool */ false);',
      },
      {
        name: 'should report missing comments for multiple arguments',
        code: 'function test(num, bool) {}; test(1, false);',
        errors: [
          {
            message: getExpectedMsg('num', 1),
          },
          {
            message: getExpectedMsg('bool', false),
          },
        ],
        output:
          'function test(num, bool) {}; test(/* num */ 1, /* bool */ false);',
      },
      {
        name: 'should report missing comments for null argument',
        code: 'function test(num, obj) {}; test(1, null);',
        errors: [
          {
            message: getExpectedMsg('num', 1),
          },
          {
            message: getExpectedMsg('obj', null),
          },
        ],
        output:
          'function test(num, obj) {}; test(/* num */ 1, /* obj */ null);',
      },
    ],
  });
});
