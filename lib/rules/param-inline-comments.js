const {
  getFunctionParams,
  isSystemCall,
  isBindOrCall,
} = require('./helper');

const isSimpleArg = (arg) =>
  arg.value === null ||
  arg.name === 'undefined' ||
  typeof arg.value === 'boolean' ||
  typeof arg.value === 'number';

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
    const sourceCode = context.sourceCode;
    const services = sourceCode.parserServices;
    if (!services || !services.program || !services.esTreeNodeToTSNodeMap) {
      return {};
    }
    const typeChecker = services.program.getTypeChecker();

    return {
      CallExpression(node) {
        try {
          const args = node.arguments;
          if (
            !args ||
            args.length < 2 ||
            (args.length === 2 && args[0].type === 'ThisExpression')
          )
            return;

          // Cheap classification first — skip whole categories of calls before
          // touching the comment scanner or the (expensive) type checker.
          const callee = node.callee;
          if (isSystemCall(callee) || isBindOrCall(callee)) return;

          // Only calls that have an uncommented simple argument are worth the
          // expensive type-checker resolution below.
          const candidateIndexes = [];
          for (let index = 0; index < args.length; index++) {
            if (
              isSimpleArg(args[index]) &&
              sourceCode.getCommentsBefore(args[index]).length === 0
            ) {
              candidateIndexes.push(index);
            }
          }
          if (candidateIndexes.length === 0) return;

          // Convert the ESTree node to a TS Node
          const tsNode = services.esTreeNodeToTSNodeMap.get(node);
          if (!tsNode) return;

          const fnParams = getFunctionParams(tsNode, typeChecker);
          if (!fnParams || fnParams.length === 0) return;

          for (const index of candidateIndexes) {
            const paramName = fnParams[index];
            if (!paramName) continue;

            const arg = args[index];
            context.report({
              node: arg,
              message: `Value '${arg.value}' should have an inline comment /* ${paramName} */`,
              fix(fixer) {
                return fixer.insertTextBefore(arg, `/* ${paramName} */ `);
              },
            });
          }
        } catch (error) {
          // console.error(error.stack);
        }
      },
    };
  },
};
