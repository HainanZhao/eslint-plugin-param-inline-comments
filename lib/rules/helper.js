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

const isSystemCall = (callee) => {
  if (callee.type !== 'Identifier') {
    return false;
  }

  switch (callee.name) {
    case 'setTimeout':
    case 'setInterval':
    case 'requestAnimationFrame':
    case 'Promise':
    case 'fetch':
    case 'XMLHttpRequest':
    case 'open':
    case 'addEventListener':
    case 'clearTimeout':
    case 'clearInterval':
    case 'alert':
    case 'confirm':
    case 'prompt':
    case 'console':
    case 'eval':
    case 'isNaN':
    case 'isFinite':
    case 'parseFloat':
    case 'parseInt':
    case 'encodeURI':
    case 'encodeURIComponent':
    case 'decodeURI':
    case 'decodeURIComponent':
    case 'escape':
    case 'unescape':
    case 'Object':
    case 'Function':
    case 'Boolean':
    case 'Symbol':
    case 'Error':
    case 'EvalError':
    case 'InternalError':
    case 'RangeError':
    case 'ReferenceError':
    case 'SyntaxError':
    case 'TypeError':
    case 'URIError':
    case 'Number':
    case 'Math':
    case 'Date':
    case 'String':
    case 'RegExp':
    case 'Array':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
    case 'ArrayBuffer':
    case 'SharedArrayBuffer':
    case 'Atomics':
    case 'DataView':
    case 'JSON':
    case 'Generator':
    case 'GeneratorFunction':
    case 'AsyncFunction':
    case 'Reflect':
    case 'Proxy':
    case 'Intl':
    case 'WebAssembly':
      return true;
    default:
      return false;
  }
};

const isBindOrCall = (callee) => {
  return (
    callee.type === 'MemberExpression' &&
    (callee?.property?.name === 'bind' || callee?.property?.name === 'call')
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
  isSystemCall,
};
