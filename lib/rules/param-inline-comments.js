module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require inline comments for ambiguous function arguments",
      category: "Best Practices",
      recommended: false
    },
    schema: [], // no options
    messages: {
      missingComment: "Simple argument should have an inline comment explaining its purpose."
    },
    fixable: "code" // added fixable property
  },
  create(context) {
    return {
      CallExpression(node) {
        node.arguments.forEach((arg, index) => {
          if (
            arg.value === null ||
            arg.value === undefined ||
            (arg.type === 'Literal' && typeof arg.value === 'boolean')
          ) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getCommentsBefore(arg);
            if (!comments.length) {
              const functionName = node.callee.name;
              const paramName = context
                .getScope()
                .variables.find((v) => v.name === functionName).defs[0].node
                .params[index].name;
              context.report({
                node: arg,
                message: `Value '${arg.value}' for param '${paramName}' should have an inline comment before it`,
                fix(fixer) {
                  return fixer.insertTextBefore(arg, `/* ${paramName} */ `);
                },
              });
            }
          }
        });
      }
    };
  }
};