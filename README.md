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
On the other hand, If you want to remove the comments added, use the `no-param-inline-comments` rule instead
```javascript
    "param-inline-comments/no-param-inline-comments": "warn"
```


## Example
Given the following code:

```javascript
function test(a, b, c, d) {
  // function body
}

test(1, true, null, false);
```
The plugin will enforce the following change:

```javascript
function test(a, b, c, d) {
  // function body
}

test(/* a */ 1, /* b */ true, /* c */ null, /* d */ false);
```

Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

License
```
This README provides a clear and concise summary of the ESLint plugin, including installation and usage instructions, an example, and information on contributing and licensing.
```