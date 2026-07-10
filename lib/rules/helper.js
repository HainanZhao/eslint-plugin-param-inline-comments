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

// Save cache to disk on exit
process.on('exit', saveCache);

// mtimes are memoized briefly so repeated calls into the same definition file
// don't hit the filesystem once per call site (long-lived IDE processes still
// pick up edits after the TTL expires)
const STAT_TTL_MS = 10000;
const statCache = new Map();

function getMtime(filePath) {
  const now = Date.now();
  const cached = statCache.get(filePath);
  if (cached && now - cached.at < STAT_TTL_MS) {
    return cached.mtime;
  }
  const mtime = fs.statSync(filePath).mtime.getTime();
  statCache.set(filePath, { at: now, mtime });
  return mtime;
}

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
    const params = signature.parameters.map((p) => p.getName());

    const definitionFilePath = declaration.getSourceFile().fileName;

    // Don't cache or process node modules or core TS library files
    if (definitionFilePath.includes('node_modules')) {
      return params;
    }

    const definitionKey = `${declaration.getStart()}`;
    const fileMtime = getMtime(definitionFilePath);

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

// This is a simple heuristic and can be improved.
const SYSTEM_CALLS = new Set([
  'setTimeout', 'setInterval', 'requestAnimationFrame', 'Promise', 'fetch',
  'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'Number', 'Math', 'Date',
  'String', 'RegExp', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'JSON',
  'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURI',
  'decodeURIComponent', 'encodeURI', 'encodeURIComponent'
]);

// Memoized per identifier name: whether it resolves to a native global function
const nativeGlobalCache = new Map();

const isSystemCall = (callee) => {
  if (callee.type !== 'Identifier') {
    return false;
  }

  const name = callee.name;
  if (SYSTEM_CALLS.has(name)) {
    return true;
  }

  let isNative = nativeGlobalCache.get(name);
  if (isNative === undefined) {
    isNative = false;
    try {
      const value = globalThis[name];
      if (typeof value === 'function') {
        isNative = Function.prototype.toString
          .call(value)
          .includes('[native code]');
      }
    } catch (e) {
      // ignore
    }
    nativeGlobalCache.set(name, isNative);
  }

  return isNative;
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
  module.exports.test = {
    saveCache,
    fileCache,
    clearCache: () => fileCache.clear(),
  };
}
