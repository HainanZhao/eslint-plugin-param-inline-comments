const ts = require('typescript');
const path = require('path');
const fs = require('fs');

const fileLanguageService = new Map();
const filePositionParamsMap = new Map();
const getFilePositionKey = (filePath, fn) => filePath + '#' + fn;

const getFunctionSignature = (filePath, fn, position) => {
  try {
    const cacheKey = getFilePositionKey(filePath, fn);

    if (filePositionParamsMap.has(cacheKey)) {
      return filePositionParamsMap.get(cacheKey);
    }

    let languageService;
    if (!fileLanguageService.has(filePath)) {
      const compilerOptions = { allowJs: true };

      const host = {
        getScriptFileNames: () => [filePath],
        getScriptVersion: () => '0',
        getScriptSnapshot: (fileName) => {
          if (!fs.existsSync(fileName)) {
            return undefined;
          }
          return ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName, 'utf8')
          );
        },
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => compilerOptions,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
      };
      languageService = ts.createLanguageService(host);
    } else {
      languageService = fileLanguageService.get(filePath);
    }

    const quickInfo = languageService.getQuickInfoAtPosition(
      filePath,
      position
    );
    if (quickInfo) {
      const displayParts = quickInfo.displayParts || [];
      const params = [];

      displayParts.forEach((part) => {
        if (part.kind === 'parameterName') {
          params.push(part.text);
        }
      });

      filePositionParamsMap.set(cacheKey, params);
      return params;
    }
  } catch (error) {
    console.error(error.stack);
  }
  return null;
};

const getFullPath = (node) => {
  if (node.type === 'Identifier') {
    return node.name;
  } else if (node.type === 'MemberExpression') {
    return `${getFullPath(node.object)}.${node.property.name}`;
  }
  return '';
};

const getLocalFunctionParams = (node, context) => {
  const scope = context.getScope();
  const functionName = node.callee.name;

  if (functionName) {
    const variable = scope.variables.find((v) => v.name === functionName);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      const functionNode = def.node;
      if (functionNode && def.node.params) {
        return def.node.params.map((param) => param.name);
      }
    }
  }
  return [];
};

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
            arg.type === 'Literal' &&
            (arg.value === null ||
              arg.value === undefined ||
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
                getFunctionSignature(filePath, fn, position)[index] ||
                `param #${index + 1}`;

              context.report({
                node: arg,
                message: `Value '${arg.value}' should have an inline comment '${paramName}'`,
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
