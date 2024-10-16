# eslint-plugin-param-inline-comments

## Description

`eslint-plugin-param-inline-comments` is an ESLint plugin that enforces inline comments for function parameters. This helps to improve code readability and maintainability by ensuring that the purpose of each parameter is clearly documented.

## Installation

To install the plugin, run:

```sh
npm install eslint-plugin-param-inline-comments --save-dev
```

## Usage
Add param-inline-comments to the plugins section of your ESLint configuration file, and configure the rule:
```javascript
module.exports = {
  plugins: [
    "param-inline-comments"
  ],
  rules: {
    "param-inline-comments/param-inline-comments": "warn"
  }
};
```

## Example
Given the following code:

```javascript
function test(a, b) {
  // function body
}

test(1, true);
```
The plugin will enforce the following change:

```javascript
function test(a, b) {
  // function body
}

test(1, /* b */ true);
```

Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

License
```
This README provides a clear and concise summary of the ESLint plugin, including installation and usage instructions, an example, and information on contributing and licensing.
```