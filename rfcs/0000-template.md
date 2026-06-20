# RFC [XXXX]: [Short Title]

* **Author(s)**: [Name / GitHub Handle]
* **Status**: `Draft` | `Proposed` | `Approved` | `Rejected`
* **Created**: [YYYY-MM-DD]
* **Target Version**: [SemVer e.g., 1.3.0]

---

## 1. Summary / Abstract

A brief (1-2 paragraphs) explanation of the proposed changes or additions to the semantic conventions.

## 2. Motivation

Why are we proposing this change? What gaps exist in the current namespaces (`ai.decision.*`, `ai.intent.*`, `ai.physical.*`, `physical.action.*`, etc.)? Provide real-world context from physical AI domains (e.g., aerospace, robotics, manufacturing, healthcare).

## 3. Detailed Design

Describe the changes in detail. Include:

### Proposed Namespace / Attributes

If adding new attributes, provide a table in the following format:

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `prefix.attribute.name` | `string` | Detailed definition of what this attribute tracks. | **Required** | `"example_val"` |

### Schema Changes

Detail how this affects:
* [JSON Schema](../schemas/age_span_schema.json)
* [Protobuf Definition](../schemas/age_span.proto)

### Examples

Provide valid JSON/YAML payload snippets demonstrating the telemetry format with the new attributes.

## 4. Backward Compatibility

Will this change break existing clients or processors?
* Does it introduce new **Required** attributes (which is generally a breaking change)?
* Does it modify types or enum values of existing attributes?

If a breaking change is proposed, outline the migration strategy.

## 5. Alternatives Considered

What other designs or namespace naming choices were considered? Why was the proposed approach selected?
