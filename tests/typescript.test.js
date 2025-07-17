const { RuleTester } = require('eslint');
const rule = require('../lib/rules/param-inline-comments');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
  },
});

describe('param-inline-comments with TypeScript', () => {
  ruleTester.run('param-inline-comments', rule, {
    valid: [
      {
        name: 'should not report when all arguments have inline comments in TypeScript',
        code: "function greet(/* name */ name: string, /* age */ age: number, /* isActive */ isActive: boolean) {\n  console.log(`Hello, ${name}! You are ${age} years old.`);\n}\n\ngreet(/* name */ \"Alice\", /* age */ 30, /* isActive */ true);\n\nfunction calculate(/* a */ a: number, /* b */ b: number, /* operation */ operation: string = \"add\") {\n  // some calculation\n}\n\ncalculate(/* a */ 10, /* b */ 5);\ncalculate(/* a */ 20, /* b */ 10, /* operation */ \"subtract\");\n",
      },
    ],
    invalid: [
      {
        name: 'should report missing comments for various argument types in TypeScript',
        code: "function greet(name: string, age: number, isActive: boolean) {\n  console.log(`Hello, ${name}! You are ${age} years old.`);\n}\n\ngreet(\"Alice\", 30, true);\n\nfunction calculate(a: number, b: number, operation: string = \"add\") {\n  // some calculation\n}\n\ncalculate(10, 5);\ncalculate(20, 10, \"subtract\");\n",
        output: "function greet(name: string, age: number, isActive: boolean) {\n  console.log(`Hello, ${name}! You are ${age} years old.`);\n}\n\ngreet(/* name */ \"Alice\", /* age */ 30, /* isActive */ true);\n\nfunction calculate(a: number, b: number, operation: string = \"add\") {\n  // some calculation\n}\n\ncalculate(/* a */ 10, /* b */ 5);\ncalculate(/* a */ 20, /* b */ 10, /* operation */ \"subtract\");\n",
        errors: [
          {
            message: "Value 'Alice' should have an inline comment /* name */",
          },
          {
            message: "Value '30' should have an inline comment /* age */",
          },
          {
            message: "Value 'true' should have an inline comment /* isActive */",
          },
          {
            message: "Value '10' should have an inline comment /* a */",
          },
          {
            message: "Value '5' should have an inline comment /* b */",
          },
          {
            message: "Value '20' should have an inline comment /* a */",
          },
          {
            message: "Value '10' should have an inline comment /* b */",
          },
          {
            message: "Value 'subtract' should have an inline comment /* operation */",
          },
        ],
      },
    ],
  });
});
