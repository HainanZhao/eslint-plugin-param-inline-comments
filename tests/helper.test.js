const {
  getLocalFunctionParams,
  isBindOrCall,
  getFunctionPosition,
  isSystemCall,
} = require('../lib/rules/helper');

describe('helper.js', () => {
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
      expect(getLocalFunctionParams(node, context)).toEqual(['a', 'b']);
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
      expect(getLocalFunctionParams(node, context)).toEqual(['a', 'b']);
    });
  });
});
