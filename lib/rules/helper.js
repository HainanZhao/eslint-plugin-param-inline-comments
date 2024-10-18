const ts = require('typescript');
const fs = require('fs');

let currentLanServiceFile = '';
let currentLanService;
const filePositionParamsMap = new Map();

const getFilePositionKey = (filePath, fn) => filePath + '#' + fn;
const getFunctionParams = (filePath, fn, position) => {
  try {
    const cacheKey = getFilePositionKey(filePath, fn);

    if (filePositionParamsMap.has(cacheKey)) {
      return filePositionParamsMap.get(cacheKey);
    }

    if (currentLanServiceFile !== filePath) {
      currentLanService?.dispose();
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
      currentLanServiceFile = filePath;
      currentLanService = ts.createLanguageService(host);
    }

    const quickInfo = currentLanService.getQuickInfoAtPosition(
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
    return [];
  }
};

const getFullPath = (node) => {
  if (node.type === 'Identifier') {
    return node.name + '[' + node.range[0] + ',' + node.range[1] + ']';
  } else if (node.type === 'MemberExpression') {
    return `${getFullPath(node.object)}.${node.property.name}`;
  }
  return '';
};

const isBindOrCall = (callee) => {
  return (
    callee.type === 'MemberExpression' &&
    (callee.property.name === 'bind' || callee.property.name === 'call')
  );
};

const getFunctionPosition = (callee, isBindOrCall) => {
  if (isBindOrCall) {
    return callee.object.range[1] - 1;
  } else {
    return callee.range[1] - 1;
  }
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
  getFunctionParams,
  getFullPath,
  getLocalFunctionParams,
  isBindOrCall,
  getFunctionPosition,
};
