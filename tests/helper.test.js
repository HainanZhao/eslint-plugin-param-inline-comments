const {
  getFullPath,
  getLocalFunctionParams,
  isBindOrCall,
  getFunctionPosition,
} = require('../lib/rules/helper');
const ts = require('typescript');
const fs = require('fs');

jest.mock('fs');
jest.mock('typescript');

describe('helper.js', () => {
  describe('getFullPath', () => {
    it('should return the name for Identifier nodes', () => {
      const node = { type: 'Identifier', range: [0, 4], name: 'test' };
      const result = getFullPath(node);
      expect(result).toBe('test[0,4]');
    });

    it('should return the full path for MemberExpression nodes', () => {
      const node = {
        type: 'MemberExpression',
        object: { type: 'Identifier', range: [0, 3], name: 'obj' },
        property: { type: 'Identifier', name: 'prop' },
      };
      const result = getFullPath(node);
      expect(result).toBe('obj[0,3].prop');
    });
  });

  describe('getLocalFunctionParams', () => {
    it('should return params of the local function', () => {
      const node = { callee: { name: 'testFunction' } };
      const context = {
        getScope: () => ({
          variables: [
            {
              name: 'testFunction',
              defs: [
                {
                  node: {
                    params: [{ name: 'param1' }, { name: 'param2' }],
                  },
                },
              ],
            },
          ],
        }),
      };
      const result = getLocalFunctionParams(node, context);
      expect(result).toEqual(['param1', 'param2']);
    });

    it('should return an empty array if function name is not found', () => {
      const node = { callee: { name: 'unknownFunction' } };
      const context = {
        getScope: () => ({
          variables: [],
        }),
      };
      const result = getLocalFunctionParams(node, context);
      expect(result).toEqual([]);
    });
  });

  describe('isBindOrCall', () => {
    it('should return true for MemberExpression with property name "bind"', () => {
      const callee = {
        type: 'MemberExpression',
        property: {
          name: 'bind',
        },
      };
      expect(isBindOrCall(callee)).toBe(true);
    });

    it('should return true for MemberExpression with property name "call"', () => {
      const callee = {
        type: 'MemberExpression',
        property: {
          name: 'call',
        },
      };
      expect(isBindOrCall(callee)).toBe(true);
    });

    it('should return false for MemberExpression with property name other than "bind" or "call"', () => {
      const callee = {
        type: 'MemberExpression',
        property: {
          name: 'apply',
        },
      };
      expect(isBindOrCall(callee)).toBe(false);
    });

    it('should return false for non-MemberExpression callee', () => {
      const callee = {
        type: 'Identifier',
        name: 'foo',
      };
      expect(isBindOrCall(callee)).toBe(false);
    });
  });

  describe('getFunctionPosition', () => {
    it('should return the position of the object when isBindOrCall is true', () => {
      const callee = {
        object: {
          range: [0, 10],
        },
        range: [0, 20],
      };
      const position = getFunctionPosition(callee, true);
      expect(position).toBe(9);
    });

    it('should return the position of the callee when isBindOrCall is false', () => {
      const callee = {
        object: {
          range: [0, 10],
        },
        range: [0, 20],
      };
      const position = getFunctionPosition(callee, false);
      expect(position).toBe(19);
    });
  });
});
