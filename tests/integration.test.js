const { Linter } = require('eslint');
const rule = require('../lib/rules/param-inline-comments');
const path = require('path');
const fs = require('fs');

const linter = new Linter();
linter.defineRule('param-inline-comments/param-inline-comments', rule);

describe('param-inline-comments with file system', () => {
  const tempDir = path.join(__dirname, 'temp');
  const tempFile = path.join(tempDir, 'test.js');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should report missing comments for a file on the file system and provide correct messages', () => {
    const code = `
function test(a, b) {
  // empty
}
test(1, true);
`;
    fs.writeFileSync(tempFile, code);

    const messages = linter.verify(code, {
      rules: {
        'param-inline-comments/param-inline-comments': 'error',
      },
    }, { filename: tempFile });

    expect(messages.length).toBe(2);
    expect(messages[0].message).toBe(
      "Value '1' should have an inline comment /* a */"
    );
    expect(messages[1].message).toBe(
      "Value 'true' should have an inline comment /* b */"
    );
  });
});