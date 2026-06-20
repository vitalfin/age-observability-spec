# Conformance & Validation

Implementations of the AGE Observability Specification can be programmatically validated for compliance using JSON schemas, Protobuf declarations, a validation CLI, and a conformance test suite.

---

## 1. Schemas

### JSON Schema
The formal specification structure is defined as a JSON Schema at [schemas/age_span_schema.json](../schemas/age_span_schema.json). This schema supports both the standard OpenTelemetry nested attribute array format and a flattened key-value object format.

### Protobuf (proto3) Spec
A formal protobuf schema is defined at [schemas/age_span.proto](../schemas/age_span.proto) to support industrial systems using gRPC or binary message serialization.

---

## 2. Validation CLI Tool

A zero-dependency Node-based linter CLI is available in the repository. It reads a trace span file and outputs errors for missing required fields/attributes, incorrect data types, or invalid enum values.

### Usage
```bash
node tools/validate-spec.js <path-to-span-json>
```

---

## 3. Conformance Test Suite

The repository contains a declarative conformance test suite under [test-suite](../test-suite/) organized as follows:
* **`test-suite/valid/`**: Telemetry payloads that MUST pass validation successfully.
* **`test-suite/invalid/`**: Edge cases and erroneous payloads that MUST fail validation (e.g. missing required columns, wrong types, invalid enum values).

You can run the suite locally using:
```bash
node tools/run-conformance-tests.js
```

In CI/CD, the test suite is executed automatically to ensure that no changes or additions break the semantic requirements.
