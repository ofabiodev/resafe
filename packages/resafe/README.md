<p align="center">
 <img src="https://github.com/ofabiodev/resafe/blob/main/.github/assets/logo.svg" align="center" width="200" alt="Resafe Logo">
 <h1 align="center">Resafe</h1>
 <p align="center">
  Lightweight package to detect unsafe regex patterns and prevent ReDoS.
 </p>
</p>
<br/>

<p align="center">
 <a href="https://github.com/ofabiodev/resafe/actions?query=branch%3Amain" rel="nofollow"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/ofabiodev/resafe/ci_test.yml?branch=main&event=push"></a>
 <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen"></a>
 <a href="https://www.npmjs.com/package/resafe" rel="nofollow"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/resafe"></a>
</p>

<div align="center">
 <a href="https://resafe.js.org">▪ Docs ▪</a>
</div>
<br/>

## What is Resafe?
**Resafe** is a mathematical ReDoS detection engine that uses **Thompson NFA construction**, **epsilon transition elimination**, and **spectral radius analysis** to detect exponential backtracking vulnerabilities. By analyzing the automaton's adjacency matrix eigenvalues, Resafe determines if a regex has exponential growth patterns without executing test strings.

## Features

- **Pure Mathematical Analysis**: Thompson NFA construction with spectral radius computation
- **Deterministic Detection**: Analyzes automaton structure, not pattern matching heuristics
- **Spectral Radius**: Detects exponential growth when eigenvalue > 1.0
- **Fast Analysis**: Average analysis time <1ms per pattern

## Installation

<table>
<tr>
<td width="300">

```bash
# Using Bun
bun add resafe
```

</td>
<td width="300">

```bash
# Using NPM
npm install resafe
```

</td>
<td width="300">

```bash
# Using Yarn
yarn add resafe
```

</td>
</tr>
</table>

## Detection Examples

<table>
  <tr>
    <th>Pattern</th>
    <th>Status</th>
    <th>Reason</th>
  </tr>
  <tr>
    <td><code>(a+)+$</code></td>
    <td><code>Unsafe</code></td>
    <td><code>Exponential backtracking</code></td>
  </tr>
  <tr>
    <td><code>^[0-9]$</code></td>
    <td><code>Safe</code></td>
    <td><code>Single path</code></td>
  </tr>
  <tr>
    <td><code>(ab|a)*</code></td>
    <td><code>Unsafe</code></td>
    <td><code>Ambiguous paths</code></td>
  </tr>
</table>

## Basic Usage

### Simple Analysis
By default, Resafe logs warnings and errors to the console if a pattern is unsafe.

```ts
import { check } from "resafe";

check(/([a-zA-Z0-9]+)*$/);
```

### Production Guard
Prevent unsafe regex from being used by throwing an error.

```ts
import { check } from "resafe";

const safeRegex = check("^[0-9]+$", { 
  throwErr: true, 
  silent: true 
});
```

### Advanced Configuration
Configure detection threshold.

```ts
import { check } from "resafe";

check("a+a+", {
  threshold: 1.5
});
```

## Why Resafe?

Regular expressions are powerful but can be a security bottleneck. A single poorly crafted regex can freeze a Node.js/Bun event loop. Resafe helps you:
1. **Educate**: Developers learn why a regex is bad through the "Solution" hints.
2. **Automate**: Run checks during CI/CD to catch ReDoS early.
3. **Secure**: Stop malicious or accidental "Catastrophic Backtracking" patterns.

## License

[MIT](LICENSE) © [ofabiodev](https://github.com/ofabiodev)