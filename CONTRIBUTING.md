# Contributing to AGE Observability Specification

Thank you for your interest in contributing to the open-source **AGE Observability Specification**! This document outlines the process for proposing updates, contributing code, and refining the conventions.

---

## How to Contribute

### 1. Reporting Issues & Feedback
If you find ambiguities, missing namespaces, or incorrect definitions in the specification:
1. Open an issue on GitHub describing the gap.
2. Provide concrete examples from your industry (e.g., aerospace, robotics, manufacturing) showing why the change is necessary.

### 2. Proposing Semantic Convention Updates (RFC Process)
To ensure backwards compatibility and high standards across industries, any change to the attributes namespace **MUST** follow our RFC process:
1. Copy the RFC template located at `rfcs/0000-template.md` to a new file: `rfcs/RFC-XXXX-short-title.md` (where XXXX is the next available sequential number).
2. Fill out the proposal details (namespace, target attributes, data types, requirement levels, and payload examples).
3. Open a Pull Request. Maintainers and community members will review and vote on adoption.

### 3. Modifying Schemas, Specifications & Tooling
* **Specifications**: Documentation files are modular and located in `specification/` (e.g., `specification/conventions/`).
* **Schemas**: JSON schemas are in `schemas/age_span_schema.json`, and Protobuf definitions are in `schemas/age_span.proto`.
* **Validation CLI**: Located in `tools/validate-spec.js`.
* **Constraint**: All validation tools **MUST** run with standard, vanilla Node.js without requiring external dependencies (`node_modules`) to keep the repo clean and zero-friction for downstream users.

---

## Pull Request Guidelines

Before opening a PR:
1. Run conformance checks locally using the test runner:
   ```bash
   node tools/run-conformance-tests.js
   ```
2. Verify all tests pass.
3. Make sure any new attributes are:
   - Added to the relevant modular markdown file under `specification/conventions/`.
   - Added to the JSON schema: `schemas/age_span_schema.json`.
   - Added to the Protobuf schema: `schemas/age_span.proto`.
4. Ensure your example JSON files under `examples/` are updated and valid.
5. If adding test fixtures, place them under `test-suite/valid/` (for payloads that MUST pass) or `test-suite/invalid/` (for payloads that MUST fail). The CI/CD pipeline validates all test files dynamically.
