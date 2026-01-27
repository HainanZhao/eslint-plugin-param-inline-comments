const fs = require('fs');
const path = require('path');

const CACHE_VERSION = '3'; // Incrementing due to architectural change
const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.cache');
const CACHE_FILE = path.join(
  CACHE_DIR,
  'eslint-plugin-param-inline-comments.json'
);

let fileCache = new Map();

// Load cache from disk
try {
  if (fs.existsSync(CACHE_FILE)) {
    const { version, data } = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (version === CACHE_VERSION) {
      for (const [filePath, fileData] of data) {
        fileData.functions = new Map(fileData.functions);
        fileCache.set(filePath, fileData);
      }
    }
  }
} catch (e) {
  fileCache.clear();
}

// Save cache to disk on exit
process.on('exit', () => {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const dataToStore = [];
    for (const [filePath, fileData] of fileCache.entries()) {
      dataToStore.push([
        filePath,
        {
          mtime: fileData.mtime,
          functions: Array.from(fileData.functions.entries()),
        },
      ]);
    }
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ version: CACHE_VERSION, data: dataToStore }),
      'utf8'
    );
  } catch (e) {
    // failed to write cache
  }
});

function getFunctionParams(tsNode, typeChecker) {
  try {
    const signature = typeChecker.getResolvedSignature(tsNode);
    if (!signature) {
      return [];
    }

    const declaration = signature.getDeclaration();
    if (!declaration || !declaration.getSourceFile()) {
        return [];
    }
    const params = signature.parameters.map(p => p.getName());

    const definitionFilePath = declaration.getSourceFile().fileName;

    // Don't cache or process node modules or core TS library files
    if (definitionFilePath.includes('node_modules')) {
        return signature.parameters.map(p => p.getName());
    }

    const definitionKey = `${declaration.getStart()}`;
    const fileStats = fs.statSync(definitionFilePath);
    const fileMtime = fileStats.mtime.getTime();

    let fileData = fileCache.get(definitionFilePath);

    // Check for stale cache
    if (fileData && fileData.mtime !== fileMtime) {
      fileData = undefined;
      fileCache.delete(definitionFilePath);
    }

    if (fileData) {
      const cachedParams = fileData.functions.get(definitionKey);
      if (cachedParams) {
        return cachedParams;
      }
    }

    // Update cache
    if (!fileData) {
      fileData = { mtime: fileMtime, functions: new Map() };
      fileCache.set(definitionFilePath, fileData);
    }
    fileData.functions.set(definitionKey, params);

    return params;
  } catch (error) {
    return [];
  }
}

const isSystemCall = (callee) => {
  if (callee.type !== 'Identifier') {
    return false;
  }

  // Check if it's a core runtime function
  try {
    const func = new Function(`return typeof ${callee.name}`)();
    if (func === 'function' || func === 'object') {
      const declaration = new Function(`return ${callee.name}`)().toString();
      if (declaration.includes('[native code]')) {
        return true;
      }
    }
  } catch(e) {
    // ignore
  }

  // This is a simple heuristic and can be improved.
  const systemCalls = new Set([
      'setTimeout', 'setInterval', 'requestAnimationFrame', 'Promise', 'fetch',
      'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'Number', 'Math', 'Date',
      'String', 'RegExp', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'JSON',
      'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURI',
      'decodeURIComponent', 'encodeURI', 'encodeURIComponent'
  ]);

  return systemCalls.has(callee.name);
};
  
  const isBindOrCall = (callee) => {
    return (
      callee.type === 'MemberExpression' &&
      (callee?.property?.name === 'bind' || callee?.property?.name === 'call')
    );
  };
  
  module.exports = {
    getFunctionParams,
    isSystemCall,
    isBindOrCall,
  };

if (process.env.NODE_ENV === 'test') {
    const saveCache = () => {
        try {
          if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
          }
          const dataToStore = [];
          for (const [filePath, fileData] of fileCache.entries()) {
            dataToStore.push([
              filePath,
              {
                mtime: fileData.mtime,
                functions: Array.from(fileData.functions.entries()),
              },
            ]);
          }
          fs.writeFileSync(
            CACHE_FILE,
            JSON.stringify({ version: CACHE_VERSION, data: dataToStore }),
            'utf8'
          );
        } catch (e) {
          // failed to write cache
        }
      };

    module.exports.test = {
      saveCache,
      fileCache,
      clearCache: () => fileCache.clear(),
    };
}
