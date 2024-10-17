const {
  getFunctionParams,
  getFullPath,
  getLocalFunctionParams,
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
});
