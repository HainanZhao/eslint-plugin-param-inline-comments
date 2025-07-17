const {
  getLocalFunctionParams,
  isBindOrCall,
  getFunctionPosition,
  isSystemCall,
} = require('../lib/rules/helper');

describe('helper.js', () => {
  let ts;
  let fs;

  // Declare these variables outside the beforeEach so they can be accessed by the tests
  let mockGetQuickInfoAtPosition;
  let mockDispose;

  // Mock the typescript module at the top level of this describe block
  jest.mock('typescript', () => {
    mockGetQuickInfoAtPosition = jest.fn();
    mockDispose = jest.fn();
    return {
      createLanguageService: jest.fn(() => ({
        getQuickInfoAtPosition: mockGetQuickInfoAtPosition,
        dispose: mockDispose,
      })),
      ScriptSnapshot: {
        fromString: jest.fn(),
      },
      getDefaultLibFilePath: jest.fn(),
      sys: {
        readDirectory: jest.fn(),
        directoryExists: jest.fn(),
        getDirectories: jest.fn(),
      },
    };
  });

  // Mock the fs module at the top level of this describe block
  jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    existsSync: jest.fn(),
  }));

  beforeEach(() => {
    jest.resetModules(); // Reset modules before each test

    ts = require('typescript'); // Re-import ts after resetModules
    fs = require('fs'); // Re-import fs after resetModules

    // Clear all mocks
    ts.createLanguageService.mockClear();
    ts.ScriptSnapshot.fromString.mockClear();
    ts.getDefaultLibFilePath.mockClear();
    ts.sys.readDirectory.mockClear();
    ts.sys.directoryExists.mockClear();
    ts.sys.getDirectories.mockClear();
    fs.readFileSync.mockClear();
    fs.existsSync.mockClear();
    mockGetQuickInfoAtPosition.mockClear();
    mockDispose.mockClear();
  });

  describe('isSystemCall', () => {
    it('should return true for system calls', () => {
      const node = { type: 'Identifier', name: 'setTimeout' };
      expect(isSystemCall(node)).toBe(true);
    });

    it('should return false for non-system calls', () => {
      const node = { type: 'Identifier', name: 'myFunction' };
      expect(isSystemCall(node)).toBe(false);
    });
  });

  describe('isBindOrCall', () => {
    it('should return true for .bind() calls', () => {
      const node = {
        type: 'MemberExpression',
        property: { name: 'bind' },
      };
      expect(isBindOrCall(node)).toBe(true);
    });

    it('should return true for .call() calls', () => {
      const node = {
        type: 'MemberExpression',
        property: { name: 'call' },
      };
      expect(isBindOrCall(node)).toBe(true);
    });

    it('should return false for other member expressions', () => {
      const node = {
        type: 'MemberExpression',
        property: { name: 'apply' },
      };
      expect(isBindOrCall(node)).toBe(false);
    });
  });

  describe('getFunctionPosition', () => {
    it('should return the correct position for regular function calls', () => {
      const callee = { range: [0, 10] };
      expect(getFunctionPosition(callee, false)).toBe(9);
    });

    it('should return the correct position for .bind() or .call() calls', () => {
      const callee = { object: { range: [0, 5] } };
      expect(getFunctionPosition(callee, true)).toBe(4);
    });
  });

  describe('getLocalFunctionParams', () => {
    it('should return an empty array if the function is not found', () => {
      const node = { callee: { name: 'nonExistent' } };
      const context = {
        getSourceCode: () => ({
          getScope: () => ({ variables: [] }),
        }),
      };
      expect(getLocalFunctionParams(node, context)).toEqual([]);
    });

    it('should return the correct params for a simple function', () => {
      const node = { callee: { name: 'myFunction' } };
      const context = {
        getSourceCode: () => ({
          getScope: () => ({
            variables: [
              {
                name: 'myFunction',
                defs: [
                  {
                    node: {
                      params: [{ type: 'Identifier', name: 'a' }, { type: 'Identifier', name: 'b' }],
                    },
                  },
                ],
              },
            ],
          }),
        }),
      };
      expect(getLocalFunctionParams(node, context)).toEqual([{ name: 'a', isRest: false }, { name: 'b', isRest: false }]);
    });

    it('should handle assignment patterns in params', () => {
      const node = { callee: { name: 'myFunction' } };
      const context = {
        getSourceCode: () => ({
          getScope: () => ({
            variables: [
              {
                name: 'myFunction',
                defs: [
                  {
                    node: {
                      params: [
                        { type: 'Identifier', name: 'a' },
                        { type: 'AssignmentPattern', left: { name: 'b' } },
                      ],
                    },
                  },
                ],
              },
            ],
          }),
        }),
      };
      expect(getLocalFunctionParams(node, context)).toEqual([{ name: 'a', isRest: false }, { name: 'b', isRest: false }]);
    });

    it('should handle rest parameters', () => {
      const node = { callee: { name: 'myFunction' } };
      const context = {
        getSourceCode: () => ({
          getScope: () => ({
            variables: [
              {
                name: 'myFunction',
                defs: [
                  {
                    node: {
                      params: [
                        { type: 'Identifier', name: 'a' },
                        { type: 'RestElement', argument: { name: 'rest' } },
                      ],
                    },
                  },
                ],
              },
            ],
          }),
        }),
      };
      expect(getLocalFunctionParams(node, context)).toEqual([{ name: 'a', isRest: false }, { name: 'rest', isRest: true }]);
    });
  });

  describe('getFunctionParams', () => {
    let getFunctionParams;

    beforeEach(() => {
      jest.resetModules(); // Reset modules before each test

      // Re-import ts and fs after resetModules
      ts = require('typescript');
      fs = require('fs');

      const helper = require('../lib/rules/helper');
      getFunctionParams = helper.getFunctionParams;

      // Clear mocks after they are assigned
      ts.createLanguageService.mockClear();
      ts.ScriptSnapshot.fromString.mockClear();
      ts.getDefaultLibFilePath.mockClear();
      ts.sys.readDirectory.mockClear();
      ts.sys.directoryExists.mockClear();
      ts.sys.getDirectories.mockClear();
      fs.readFileSync.mockClear();
      fs.existsSync.mockClear();
      mockGetQuickInfoAtPosition.mockClear();
      mockDispose.mockClear();

      // Mock ScriptSnapshot.fromString and getDefaultLibFilePath
      ts.ScriptSnapshot.fromString.mockImplementation((code) => ({ code }));
      ts.getDefaultLibFilePath.mockReturnValue('/mock/lib.d.ts');
    });

    it('should return function parameters when quickInfo is available', () => {
      mockGetQuickInfoAtPosition.mockReturnValue({
        displayParts: [
          { kind: 'parameterName', text: 'param1' },
          { kind: 'punctuation', text: ':' },
          { kind: 'keyword', text: 'any' },
          { kind: 'punctuation', text: ',' },
          { kind: 'parameterName', text: 'param2' },
          { kind: 'punctuation', text: ':' },
          { kind: 'keyword', text: 'string' },
        ],
      });

      const params = getFunctionParams('test.js', 0, 'function func(param1, param2) {}');
      expect(params).toEqual(['param1', 'param2']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledWith('test.js', 0);
    });

    it('should return an empty array if displayParts is empty', () => {
      mockGetQuickInfoAtPosition.mockReturnValue({
        displayParts: [],
      });

      const params = getFunctionParams('test.js', 0, 'function func() {}');
      expect(params).toEqual([]);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledWith('test.js', 0);
    });

    it('should handle errors gracefully and return an empty array', () => {
      mockGetQuickInfoAtPosition.mockImplementation(() => {
        throw new Error('Test error');
      });

      const params = getFunctionParams('test.js', 0, 'function func() {}');
      expect(params).toEqual([]);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledWith('test.js', 0);
    });

    it('should use cached params for non-test files', () => {
      mockGetQuickInfoAtPosition.mockReturnValueOnce({
        displayParts: [{ kind: 'parameterName', text: 'cachedParam' }],
      });

      const params1 = getFunctionParams('cachedFile.js', 10, 'function func(cachedParam) {}');
      expect(params1).toEqual(['cachedParam']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledTimes(1);

      // For the second call, we expect the cached value, so mockGetQuickInfoAtPosition should not be called again
      const params2 = getFunctionParams('cachedFile.js', 10, 'function func(cachedParam) {}');
      expect(params2).toEqual(['cachedParam']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledTimes(1); // Still 1, as it used cache

      mockGetQuickInfoAtPosition.mockReturnValueOnce({
        displayParts: [{ kind: 'parameterName', text: 'anotherParam' }],
      });
      const params3 = getFunctionParams('anotherFile.js', 20, 'function func(anotherParam) {}');
      expect(params3).toEqual(['anotherParam']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledTimes(2);
    });

    it('should not use cache for test files (<input>)', () => {
      mockGetQuickInfoAtPosition.mockReturnValueOnce({
        displayParts: [{ kind: 'parameterName', text: 'testParam1' }],
      });
      mockGetQuickInfoAtPosition.mockReturnValueOnce({
        displayParts: [{ kind: 'parameterName', text: 'testParam2' }],
      });

      const params1 = getFunctionParams('<input>', 0, 'function func(testParam1) {}');
      expect(params1).toEqual(['testParam1']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledTimes(1);

      const params2 = getFunctionParams('<input>', 0, 'function func(testParam2) {}');
      expect(params2).toEqual(['testParam2']);
      expect(mockGetQuickInfoAtPosition).toHaveBeenCalledTimes(2); // Called again
    });

    it('should dispose language service and create new one if filePath changes', () => {
      const disposeMock1 = jest.fn();
      const disposeMock2 = jest.fn();

      ts.createLanguageService.mockImplementationOnce(() => ({
        getQuickInfoAtPosition: mockGetQuickInfoAtPosition,
        dispose: disposeMock1,
      })).mockImplementationOnce(() => ({
        getQuickInfoAtPosition: mockGetQuickInfoAtPosition,
        dispose: disposeMock2,
      }));

      getFunctionParams('file1.js', 0, 'function func1() {}');
      getFunctionParams('file2.js', 0, 'function func2() {}');

      expect(disposeMock1).toHaveBeenCalledTimes(1);
      expect(disposeMock2).not.toHaveBeenCalled(); // Only the first one should be disposed when file changes
      expect(ts.createLanguageService).toHaveBeenCalledTimes(2);
    });

    it('should use provided sourceText over fs.readFileSync', () => {
      fs.readFileSync.mockReturnValue('function func(shouldNotBeUsed) {}');
      mockGetQuickInfoAtPosition.mockReturnValue({
        displayParts: [{ kind: 'parameterName', text: 'usedSourceText' }],
      });

      const params = getFunctionParams('fileToRead.js', 0, 'function func(usedSourceText) {}');
      expect(params).toEqual(['usedSourceText']);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });
});
