const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('no-param-inline-comments-callback', rule, {
  valid: [
    {
      code: 'setTimeout(() => { console.log("hello"); }, 1000);',
    },
    {
      code: 'Promise.resolve().then(result => { return result; });',
    },
    {
      code: 'setTimeout(/*callback*/() => { console.log("hello"); }, 1000);',
    },
  ],
  invalid: [
    {
      code: 'setTimeout(/* callback */ () => { console.log("hello"); }, 1000);',
      errors: [{ messageId: 'removeComment' }],
      output: 'setTimeout( () => { console.log("hello"); }, 1000);',
    },
    {
      code: 'Promise.resolve().then(/* onFulfilled */ result => { return result; });',
      errors: [{ messageId: 'removeComment' }],
      output: 'Promise.resolve().then( result => { return result; });',
    },
  ],
});