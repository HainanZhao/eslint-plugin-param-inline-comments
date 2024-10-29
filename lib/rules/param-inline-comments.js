const {
  getFunctionParams,
  isSystemCall,
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
        try {
          if (
            !node.arguments ||
            node.arguments.length === 1 ||
            (node.arguments.length === 2 &&
              node.arguments[0].type === 'ThisExpression')
          )
            return;

          if (isSystemCall(node.callee)) return;

          let fnParams = null;

          node.arguments.forEach((arg, index) => {
            if (
              arg.value === null ||
              arg.name === 'undefined' ||
              typeof arg.value === 'boolean' ||
              typeof arg.value === 'number'
            ) {
              const sourceCode = context.getSourceCode();
              const filePath = context.getFilename();
              const comments = sourceCode.getCommentsBefore(arg);
              if (comments.length) return;

              const isBindCall = isBindOrCall(node.callee);

              // For .bind() or .call() we need to adjust the index, and skip the first argument
              const realIndex = isBindCall ? index - 1 : index;
              if (realIndex < 0) return;

              if (!fnParams) {
                const functionPath = getFullPath(node.callee);
                const position = getFunctionPosition(node.callee, isBindCall);
                fnParams = getFunctionParams(filePath, functionPath, position);
              }
              let paramName = fnParams?.[realIndex];

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
          });
        } catch (error) {
          console.error(error.stack);
        }
      },
    };
  },
};
