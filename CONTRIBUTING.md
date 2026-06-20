# Contributing to AGE Observability Specification

Thank you for your interest in contributing to the open-source **AGE Observability Specification**! This document outlines the process for proposing updates, contributing code, and refining the conventions.

---

## How to Contribute

### 1. Reporting Issues & Feedback
If you find ambiguities, missing namespaces, or incorrect definitions in the specification:
1. Open an issue on GitHub describing the gap.
2. Provide concrete examples from your industry (e.g., aerospace, robotics, manufacturing) showing why the change is necessary.

### 2. Proposing Semantic Convention Updates (RFC Process)
To ensure backwards compatibility and high standards across industries, any change to the attributes namespace must follow our RFC process:
1. Create a markdown file in the `rfcs/` directory using the name `RFC-XXXX-short-title.md`.
2. Detail the proposed namespace, target attributes, data types, requirement levels (Required, Recommended, Optional), and concrete payload examples.
3. Open a Pull Request. Maintainers and community members will review, suggest tweaks, and vote on adoption.

### 3. Modifying Schemas & Tooling
If you are modifying the JSON Schema or validation tools:
- The JSON schemas are located in `/schemas`.
- Validation tools are in `/tools`.
- **Constraint**: All validation tools must run with standard, vanilla Node.js without requiring external dependencies (`node_modules`) to keep the repo clean and zero-friction for downstream projects.

---

## Pull Request Guidelines

Before opening a PR:
1. Run conformance checks locally using the test runner:
   ```bash
   node tools/run-conformance-tests.js
   ```
2. Verify all tests pass.
3. Make sure any new attributes are documented in `SPECIFICATION.md` and added to `schemas/age_span_schema.json`.
4. Ensure your example JSON files are updated and valid. The CI/CD pipeline validates all example files in the repository.
