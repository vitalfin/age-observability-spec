# Human Interaction & Intervention Conventions

These attributes capture manual overrides, overrides of limits, and human-in-the-loop adjustments, which are essential for documenting accountability.

## Namespace Attributes

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `ai.human.intervention` | `boolean` | Flag indicating whether a human operator intervened during execution. | **Required** | `true`, `false` |
| `ai.human.alteration` | `string` | Details of any manual overrides or parameter tweaks applied. | **Recommended** | `"feedrate_override:80%"`, `"temp_limit:130C"` |
| `external.interaction.type` | `string` | Category of the human/external action. | **Recommended** | `"operator_stop"`, `"manual_tuning"`, `"feedrate_override"` |

## Compliance Rules (RFC 2119)

1. Every telemetry span conforming to the AGE Observability Specification **MUST** define `ai.human.intervention` as a boolean indicating whether a human operator intervened in the loop.
2. If `ai.human.intervention` is `true`, details regarding the nature of the manual override **SHOULD** be documented in `ai.human.alteration` and classified using `external.interaction.type`.
