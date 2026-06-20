# AGE Decision & Simulation Conventions

These attributes record the upstream design decisions and simulation results that led to a command. If a physical part or motor fails, these attributes help trace whether the fault originated in the thermodynamic model, material choice, simulation inputs/outputs, or prompt context.

## Namespace Attributes

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `ai.model.name` | `string` | The identifier/name of the AGE model. | **Required** | `"prometheus-age-v1"` |
| `ai.model.version` | `string` | Semantic version or hash of the model. | **Recommended** | `"1.2.4"` |
| `ai.model.confidence` | `double` | Model confidence score (between `0.0` and `1.0`). | **Recommended** | `0.94` |
| `ai.agent.id` | `string` | Unique identifier of the AGE agent instance. | **Required** | `"milling-agent-01"`, `"thermo-design-bot"` |
| `ai.simulation.type` | `string` | The type of simulation executed prior to the action. | **Recommended** | `"thermodynamics"`, `"kinematics"`, `"structural_stress"` |
| `ai.simulation.inputs` | `string` | Serialized input parameters for the simulation. | **Recommended** | `"feedrate:1200;spindle_speed:8000"` |
| `ai.simulation.outputs` | `string` | Serialized outputs or results of the simulation. | **Recommended** | `"max_deflection_mm:0.02;passed:true"` |
| `ai.simulation.result` | `string` | The outcome of the simulation. MUST be either `passed` or `failed`. | **Recommended** | `"passed"`, `"failed"` |
| `ai.decision.material` | `string` | The material chosen or assumed by the AGE during design. | **Optional** | `"titanium_grade_5"`, `"aluminum_6061"` |

## Compliance Rules (RFC 2119)

1. Spans documenting an AGE decision **MUST** include the `ai.model.name` and `ai.agent.id` attributes.
2. The `ai.model.confidence` attribute **SHOULD** be included, and if present, it **MUST** be a floating-point number between `0.0` and `1.0` inclusive.
3. If a simulation is run before execution, `ai.simulation.type` and `ai.simulation.result` **SHOULD** be included.
4. The `ai.simulation.result` value **MUST** be either `"passed"` or `"failed"` if it is present.
