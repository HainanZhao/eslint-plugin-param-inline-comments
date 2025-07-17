const ts = require('typescript');
const fs = require('fs');

let currentLanServiceFile = '';
let currentLanService;
const filePositionParamsMap = new Map();

const getFilePositionKey = (filePath, position) =>
  filePath + '#' + position;

const getFunctionParams = (filePath, position, sourceText) => {
  try {
    const isTest = filePath === '<input>';
    const cacheKey = getFilePositionKey(filePath, position);

    if (!isTest && filePositionParamsMap.has(cacheKey)) {
      return filePositionParamsMap.get(cacheKey);
    }

    if (currentLanServiceFile !== filePath || isTest) {
      currentLanService?.dispose();
      const compilerOptions = { allowJs: true };

      const host = {
        getScriptFileNames: () => [filePath],
        getScriptVersion: () => '0',
        getScriptSnapshot: (fileName) => {
          if (fileName === filePath) {
            const code = sourceText || fs.readFileSync(fileName, 'utf8');
            return ts.ScriptSnapshot.fromString(code);
          }
          return undefined;
        },
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => compilerOptions,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: (fileName) => fileName === filePath || fs.existsSync(fileName),
        readFile: (fileName) => {
          if (fileName === filePath) {
            return sourceText || fs.readFileSync(fileName, 'utf8');
          }
          return fs.readFileSync(fileName, 'utf8');
        },
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
    if (!quickInfo) {
      console.log('No quickInfo for:', filePath, position, sourceText);
    }
    if (quickInfo) {
      const displayParts = quickInfo.displayParts || [];
      const params = [];

      displayParts.forEach((part) => {
        if (part.kind === 'parameterName') {
          params.push(part.text);
        }
      });

      if (!isTest) {
        filePositionParamsMap.set(cacheKey, params);
      }
      return params;
    }
  } catch (error) {
    return [];
  }
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
  const sourceCode = context.getSourceCode();
  const scope = sourceCode.getScope(node);
  const functionName = node.callee.name;

  if (functionName) {
    const variable = scope.variables.find((v) => v.name === functionName);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      const functionNode = def.node;
      if (functionNode && def.node.params) {
        return def.node.params.map((param) => {
          if (param.type === 'Identifier') {
            return { name: param.name, isRest: false };
          } else if (param.type === 'AssignmentPattern') {
            return { name: param.left.name, isRest: false };
          }
          else if (param.type === 'RestElement') {
            return { name: param.argument.name, isRest: true };
          }
          return null;
        }).filter(Boolean);
      }
    }
  }
  return [];
};

module.exports = {
  getFunctionParams,
  getLocalFunctionParams,
  isBindOrCall,
  getFunctionPosition,
  isSystemCall,
};