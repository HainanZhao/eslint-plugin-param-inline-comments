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

## Design

This plugin is designed with performance in mind, using a caching mechanism to avoid re-processing files unnecessarily.

### Performance Caching

To improve performance, the plugin caches information about function parameters. Here's how it works:

*   **On-Disk Cache:** The cache is stored in a JSON file at `node_modules/.cache/eslint-plugin-param-inline-comments.json`. This allows the cache to persist between runs of ESLint.
*   **In-Memory Cache:** For even faster access during a single ESLint run, the cache is loaded into an in-memory `Map`.
*   **Cache Invalidation:** The cache is invalidated in two ways:
    1.  **Cache Version:** A `CACHE_VERSION` is defined in the code. If this version changes (due to a change in the plugin's architecture), the entire cache is discarded.
    2.  **File Modification Time:** When a file is processed, its modification time (`mtime`) is checked against the cached modification time. If the file has been changed, its cached information is invalidated and re-processed.
*   **Ignoring `node_modules`:** To further improve performance, the plugin does not process or cache any files located in `node_modules`.

### System Call Heuristics

The plugin uses simple heuristics to detect and ignore system calls (e.g., `setTimeout`, `Promise`) and methods like `.bind()` and `.call()`. This prevents the plugin from attempting to add parameter comments to built-in functions where it would not be appropriate.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

### Development Environment

This project includes a `.npmrc` file to ensure a consistent development environment for all contributors. This file is configured to use the public npm registry (`https://registry.npmjs.org/`). This prevents issues that can arise from global npm configurations that might point to private or company-specific registries.

When you run `npm install` in this project, it will use the public registry defined in the local `.npmrc` file, ignoring any global registry settings.

## License
This project is licensed under the MIT License.