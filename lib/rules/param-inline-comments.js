const {
  getFunctionParams,
  isSystemCall,
  isBindOrCall,
} = require('./helper');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require inline comments for ambiguous function arguments',
      category: 'Best Practices',
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [], // no options
    messages: {
      missingComment:
        'Simple argument should have an inline comment explaining its purpose.',
    },
    fixable: 'code',
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services || !services.program) {
      return {};
    }
    const typeChecker = services.program.getTypeChecker();

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

          // Convert the ESTree node to a TS Node
          const tsNode = services.esTreeNodeToTSNodeMap.get(node);
          if (!tsNode) return;

          const fnParams = getFunctionParams(tsNode, typeChecker);
          if (!fnParams) return;


          node.arguments.forEach((arg, index) => {
            if (
              arg.value === null ||
              arg.name === 'undefined' ||
              typeof arg.value === 'boolean' ||
              typeof arg.value === 'number'
            ) {
              const sourceCode = context.getSourceCode();
              const comments = sourceCode.getCommentsBefore(arg);
              if (comments.length) return;

              const isBindCall = isBindOrCall(node.callee);

              // For .bind() or .call() we need to adjust the index, and skip the first argument
              const realIndex = isBindCall ? index - 1 : index;
              if (realIndex < 0) return;

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
          // console.error(error.stack);
        }
      },
    };
  },
};