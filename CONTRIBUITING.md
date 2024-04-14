# Contributing to BalanceBookJS

We appreciate your interest in contributing to BalanceBookJS! To maintain the quality of our codebase and ensure consistent releases, we adhere to specific commit message conventions. This document outlines how to format your commit messages to comply with our workflow.

## Commit Message Format

Each commit message should include a header, a body, and a footer. The header has a special format that includes a type, a scope, and a subject:


Para asegurar que todos los contribuyentes a tu repositorio sigan una convención de commits coherente y que Semantic Release pueda automatizar el proceso de versionado y lanzamiento, es fundamental proporcionar una guía clara sobre cómo se deben hacer los commits. Aquí te proporciono una documentación en formato Markdown que puedes incluir en un archivo CONTRIBUTING.md o README.md en tu repositorio:

markdown
Copy code
# Contributing to BalanceBookJS

We appreciate your interest in contributing to BalanceBookJS! To maintain the quality of our codebase and ensure consistent releases, we adhere to specific commit message conventions. This document outlines how to format your commit messages to comply with our workflow.

## Commit Message Format

Each commit message should include a header, a body, and a footer. The header has a special format that includes a type, a scope, and a subject:

```
<type>(<scope>): <subject>
<BLANK LINE>

<body>
<BLANK LINE>
<footer>
```

### Type
Indicates the type of changes in the commit. This can affect the version number based on semantic versioning. Possible types include:

- **feat**: A new feature (corresponds to MINOR in semantic versioning).
- **fix**: A bug fix (corresponds to PATCH in semantic versioning).
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation.
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).

### Scope
The scope should indicate the location of the change (e.g., component or file name).

### Subject
The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes".
- Don't capitalize the first letter.
- No dot (.) at the end.

### Body
The body should include a detailed description of the change:

- Explain the problem that this commit is solving.
- Focus on why you are making this change as opposed to how (the code will explain itself).
- Can include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about Breaking Changes and is also the place to reference GitHub issues that this commit Closes.

## Examples

Here’s an example of a good commit message:
```
feat(journal-entry): add multi-currency support

Implement support for multi-currency transactions within journal entries. This allows users to record transactions in different currencies, automatically converting them based on the current exchange rates.
```

```
fix(account-validation): correct balance check error

Fix an issue where the balance check did not account for pending transactions, which could lead to incorrect balance displays under certain conditions.
```
