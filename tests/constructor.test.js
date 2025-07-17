const { RuleTester } = require('eslint');
const noParamInlineComments = require('../lib/rules/no-param-inline-comments');
const paramInlineComments = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('no-param-inline-comments-constructor', noParamInlineComments, {
  valid: [
    {
      code: 'class User { constructor(name, age) {} }; new User("John", 30);',
    },
  ],
  invalid: [
    {
      code: 'class User { constructor(name, age) {} }; new User(/* name */ "John", /* age */ 30);',
      errors: [{ messageId: 'removeComment' }, { messageId: 'removeComment' }],
      output: 'class User { constructor(name, age) {} }; new User( "John",  30);',
    },
  ],
});

ruleTester.run('param-inline-comments-constructor', paramInlineComments, {
  valid: [
    {
        code: 'class User { constructor(name, age) {} }; new User(/* name */ "John", /* age */ 30);',
    },
  ],
  invalid: [
    {
      code: 'class User { constructor(name, age) {} }; new User("John", 30);',
      errors: [
        { message: `Value '"John"' should have an inline comment /* name */` },
        { message: `Value '30' should have an inline comment /* age */` },
      ],
      output: 'class User { constructor(name, age) {} }; new User(/* name */ "John", /* age */ 30);',
    },
  ],
});
