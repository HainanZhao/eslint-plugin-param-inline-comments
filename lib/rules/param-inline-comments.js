const {
  getFunctionParams,
  isSystemCall,
  getFunctionPosition,
  isBindOrCall,
  getLocalFunctionParams,
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
    function check(node) {
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
            typeof arg.value === 'number' ||
            typeof arg.value === 'string'
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
              // Try to get params from local function first
              const localParams = getLocalFunctionParams(node, context);
              if (localParams && localParams.length > 0) {
                fnParams = localParams;
              } else if (filePath === '<input>') {
                fnParams = getLocalFunctionParams(node, context);
              } else {
                const position = getFunctionPosition(node.callee, isBindCall);
                fnParams = getFunctionParams(
                  filePath,
                  position,
                  sourceCode.text
                );
              }
            }
            let param = fnParams?.[realIndex];

            if (!param || !param.name) return;

            // If it's a rest parameter, we don't enforce comments on individual arguments
            if (param.isRest) return;

            context.report({
              node: arg,
              message: `Value '${arg.value}' should have an inline comment /* ${param.name} */`,
              fix(fixer) {
                return fixer.insertTextBefore(
                  arg,
                  `/* ${param.name || 'paramName'} */ `
                );
              },
            });
          }
        });
      } catch (error) {
        console.error(error.stack);
      }
    }

    return {
      CallExpression: check,
      NewExpression: check,
    };
  },
};