const { RuleTester } = require('eslint');
const noParamInlineComments = require('../lib/rules/no-param-inline-comments');
const paramInlineComments = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

// Test cases for no-param-inline-comments with rest parameters
ruleTester.run('no-param-inline-comments-rest-parameters', noParamInlineComments, {
  valid: [
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log("info", "hello", "world");',
    },
  ],
  invalid: [
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log(/* type */ "info", /* msg1 */ "hello", /* msg2 */ "world");',
      errors: [{ messageId: 'removeComment' }, { messageId: 'removeComment' }, { messageId: 'removeComment' }],
      output: 'function log(type, ...messages) { console.log(type, messages); }; log( "info",  "hello",  "world");',
    },
  ],
});

// Test cases for param-inline-comments with rest parameters
ruleTester.run('param-inline-comments-rest-parameters', paramInlineComments, {
  valid: [
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log(/* type */ "info", "hello", "world");',
    },
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log(/* type */ "info", /* messages */ "hello", /* messages */ "world");',
    },
    ],
  invalid: [
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log("info", "hello", "world");',
      errors: [
        { message: `Value 'info' should have an inline comment /* type */` },
      ],
      output: 'function log(type, ...messages) { console.log(type, messages); }; log(/* type */ "info", "hello", "world");',
    },
    {
      code: 'function log(type, ...messages) { console.log(type, messages); }; log("info", "hello", "world");', // This was previously in valid, but should be invalid
      errors: [
        { message: `Value 'info' should have an inline comment /* type */` },
      ],
      output: 'function log(type, ...messages) { console.log(type, messages); }; log(/* type */ "info", "hello", "world");',
    },
  ],
});