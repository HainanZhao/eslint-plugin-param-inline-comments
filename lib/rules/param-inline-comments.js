const {
  getFunctionParams,
  getLocalFunctionParams,
  getFullPath,
  getFunctionPosition,
  isBindOrCall,
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
        if (
          !node.arguments ||
          node.arguments.length === 1 ||
          (node.arguments.length === 2 &&
            node.arguments[0].type === 'ThisExpression')
        )
          return;
        node.arguments.forEach((arg, index) => {
          if (
            arg.value === null ||
            arg.name === 'undefined' ||
            typeof arg.value === 'boolean' ||
            typeof arg.value === 'number'
          ) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getCommentsBefore(arg);

            if (!comments.length) {
              const isBindCall = isBindOrCall(node.callee);
              // For .bind() or .call() we need to adjust the index, and skip the first argument
              const realIndex = isBindCall ? index - 1 : index;
              if (realIndex < 0) return;

              let paramName = getLocalFunctionParams(node, context)[realIndex];
              if (!paramName) {
                const filePath = context.getFilename();
                const functionPath = getFullPath(node.callee);
                const position = getFunctionPosition(node.callee, isBindCall);
                const fnParams = getFunctionParams(
                  filePath,
                  functionPath,
                  position
                );
                paramName = fnParams[realIndex];
              }

              if (!paramName) return;

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
