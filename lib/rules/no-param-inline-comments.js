module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Remove inline comments before arguments',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [], // no options
    messages: {
      removeComment: 'Remove inline comment before argument',
    },
    fixable: 'code', // added fixable property
  },
  create(context) {
    return {
      CallExpression(node) {
        node.arguments.forEach((arg) => {
          const sourceCode = context.getSourceCode();
          const comments = sourceCode.getCommentsBefore(arg);

          comments.forEach((comment) => {
            context.report({
              node: comment,
              messageId: 'removeComment',
              fix(fixer) {
                return fixer.remove(comment);
              },
            });
          });
        });
      },
    };
  },
};
