# Project-Specific Guidelines for Gemini

This document outlines specific instructions and conventions for the Gemini agent when working within the `eslint-plugin-param-inline-comments` repository.

## Project Overview
This repository contains an ESLint plugin designed to enforce or remove inline comments for function parameters.

## Key Technologies
- **Language:** JavaScript
- **Linting:** ESLint
- **Testing:** Jest
- **Dependencies:** Uses `typescript` for language service features in helper functions.

## Common Commands
- **Install Dependencies:** `npm install`
- **Run Tests:** `npm test`

## Code Conventions
- Adhere to existing ESLint rules and code style.
- When modifying rules, ensure test coverage is maintained or improved.

## Testing Strategy
- Unit tests are located in `tests/`.
- Integration tests (if applicable) should simulate real-world ESLint usage.
- When adding new features or fixing bugs, ensure relevant tests are added or updated.

## Troubleshooting
- If TypeScript Language Service errors occur during testing, refer to `lib/rules/helper.js` for the in-memory test environment workaround.
