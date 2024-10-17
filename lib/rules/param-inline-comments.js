const {
  getFunctionParams,
  getLocalFunctionParams,
  getFullPath,
} = require('./helper');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require inline comments for ambiguous function arguments',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [], // no options
    messages: {
      missingComment:
        'Simple argument should have an inline comment explaining its purpose.',
    },
    fixable: 'code', // added fixable property
  },
  create(context) {
    return {
      CallExpression(node) {
        node.arguments.forEach((arg, index) => {
          if (
            index > 0 &&
            (arg.value === null ||
              arg.name === 'undefined' ||
              typeof arg.value === 'boolean')
          ) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getCommentsBefore(arg);

            if (!comments.length) {
              const filePath = context.getFilename();
              const fn = getFullPath(node.callee);
              const position = node.callee.range[1] - 1;
              const paramName =
                getLocalFunctionParams(node, context)[index] ||
                getFunctionParams(filePath, fn, position)[index] ||
                `param #${index + 1}`;

              context.report({
                node: arg,
                message: `Value '${arg.value}' should have an inline comment /* ${paramName} */`,
                fix(fixer) {
                  return fixer.insertTextBefore(
                    arg,
                    `/* ${paramName || 'paramName'} */ `
                  );
                },
              });
            }
          }
        });
      },
    };
  },
};
