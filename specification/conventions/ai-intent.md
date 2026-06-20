# AGE Intent Conventions

These attributes record what the AGE was trying to achieve. Capturing intent is crucial for auditing whether an action was an intended behavior or an out-of-control command loop.

## Namespace Attributes

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `ai.intent.goal` | `string` | The high-level physical objective or task. | **Required** | `"smooth_deceleration"`, `"hole_drilling"` |
| `ai.intent.plan_step` | `string` | The active step in a multi-stage plan. | **Recommended** | `"step_3_milling"`, `"decelerate"` |
| `ai.intent.safety_envelope` | `string` | Serialized safety/threshold limits computed by the AGE. | **Optional** | `"max_temp:120C;max_rpm:12000"` |

## Compliance Rules (RFC 2119)

1. Every span conforming to the AGE Observability Specification **MUST** include the `ai.intent.goal` attribute to specify the intended target of the action.
2. Complex multi-step operations **SHOULD** include the `ai.intent.plan_step` attribute to aid in execution trace mapping.
3. The `ai.intent.safety_envelope` attribute **MAY** be included to record dynamic safety boundaries calculated by the agent.
