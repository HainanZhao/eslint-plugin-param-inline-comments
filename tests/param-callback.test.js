const { RuleTester } = require('eslint');
const rule = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('param-inline-comments-callback', rule, {
  valid: [
    {
      code: 'setTimeout(() => { console.log("hello"); }, 1000);',
    },
    {
      code: 'Promise.resolve().then(result => { return result; });',
    },
    {
        code: 'setTimeout(/* callback */ () => { console.log("hello"); }, /* delay */ 1000);',
    },
    {
        code: 'Promise.resolve().then(/* onFulfilled */ result => { return result; });',
    }
  ],
  invalid: [
    {
      code: 'setTimeout(() => { console.log("hello"); }, 1000);',
      errors: [{ message: "Value 'undefined' should have an inline comment /* callback */" }, { message: "Value '1000' should have an inline comment /* delay */" }],
      output: 'setTimeout(/* callback */ () => { console.log("hello"); }, /* delay */ 1000);',
    },
    {
      code: 'Promise.resolve().then(result => { return result; });',
      errors: [{ message: "Value 'undefined' should have an inline comment /* onFulfilled */" }],
      output: 'Promise.resolve().then(/* onFulfilled */ result => { return result; });',
    },
  ],
});
