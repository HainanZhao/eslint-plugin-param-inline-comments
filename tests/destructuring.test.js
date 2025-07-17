const { RuleTester } = require('eslint');
const noParamInlineComments = require('../lib/rules/no-param-inline-comments');
const paramInlineComments = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

// Test cases for no-param-inline-comments with destructured parameters
ruleTester.run('no-param-inline-comments-destructuring', noParamInlineComments, {
  valid: [
    {
      code: 'function process({ data, options }) { console.log(data, options); }; process({ data: [], options: {} });',
    },
  ],
  invalid: [
    {
      code: 'function process({ data, options }) { console.log(data, options); }; process(/* data */ { data: [], options: {} });',
      errors: [{ messageId: 'removeComment' }],
      output: 'function process({ data, options }) { console.log(data, options); }; process( { data: [], options: {} });',
    },
  ],
});
