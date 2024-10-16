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
    const getFunctionParams = (node, context) => {
      const scope = context.getScope();
      const functionName = node.callee.name;

      if (functionName) {
        const variable = scope.variables.find((v) => v.name === functionName);
        if (variable && variable.defs.length > 0) {
          const def = variable.defs[0];
          if (def.node && def.node.params) {
            return def.node.params.map((param) => param.name);
          }
        }
      }
      return [];
    };

    return {
      CallExpression(node) {
        node.arguments.forEach((arg, index) => {
          if (
            arg.type === 'Literal' &&
            (arg.value === null ||
              arg.value === undefined ||
              typeof arg.value === 'boolean')
          ) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getCommentsBefore(arg);
            if (!comments.length) {
              const paramName =
                getFunctionParams(node, context)[index] || 'parameterName';

              context.report({
                node: arg,
                message: `Value '${arg.value}' should have an inline comment to document the parameter name`,
                fix(fixer) {
                  return fixer.insertTextBefore(arg, `/* ${paramName} */ `);
                },
              });
            }
          }
        });
      },
    };
  },
};
