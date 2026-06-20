# AGE Observability Specification

This directory contains the formal semantic conventions and requirements for telemetry in Artificial General Engineering (AGE) systems.

## Namespace Hierarchy

To enable complete tracing from prompt to physical feedback, attributes MUST be organized into five core namespaces:
1. **`ai.decision` & `ai.simulation` & `ai.agent`**: Traces the reasoning, model name, agent ID, simulation inputs/outputs (thermodynamics, kinematics), and design selections (materials).
2. **`ai.intent`**: Captures the high-level objective/goal planned by the AGE.
3. **`ai.physical` & `physical.sensor` & `industrial`**: Tracks the legacy or industrial protocols and translation of AGE decisions into mechanical commands sent to specific hardware targets.
4. **`physical.action` & `physical.anomaly`**: Captures the actual execution results, deviations, and mechanical anomalies.
5. **`ai.human` & `external.interaction`**: Tracks manual adjustments, operator override mode, human intervention flags, and external system sync events.

Detailed convention specifications:
- [AGE Decision & Simulation Conventions](conventions/ai-decision.md)
- [AGE Intent Conventions](conventions/ai-intent.md)
- [Physical Control & Protocols Conventions](conventions/physical-control.md)
- [Physical Action & Anomaly Conventions](conventions/physical-action.md)
- [Human Interaction Conventions](conventions/human-interaction.md)
- [Dynamic Industry Extensions](conventions/dynamic-extensions.md)

For verifying conformance, see [Conformance Verification](../specification/conformance.md).

---

## Trace & Log Correlation via Log Forwarder / Collector

Raw logs captured from edge PLC and CNC devices by a log forwarder (such as Fluent Bit) SHOULD be injected with the active `trace_id` and `span_id` of the propagating context.
During ingestion, these log records MUST be persisted and linked directly to the trace session. In observability dashboards, a user SHOULD be able to expand a specific telemetry plot point (e.g., a physical deviation anomaly) and view the exact stream of logs that led up to that point.

---

## Span Structure Example

Here is an example span representing an AGE planning a milling action, validating it via simulations, sending commands via MTConnect, and recording a physical deviation and human override because of thermal expansion:

```yaml
Span:
  Name: "CNC Milling Command Cycle"
  TraceID: "4bf92f3577b34da6a3ce929d0e0e4736"
  SpanID: "00f067aa0ba902b7"
  Kind: INTERNAL
  Attributes:
    # 1. AGE Model & Decision & Simulation
    - key: "ai.model.name"
      value: { stringValue: "prometheus-age-v1" }
    - key: "ai.agent.id"
      value: { stringValue: "milling-agent-01" }
    - key: "ai.simulation.inputs"
      value: { stringValue: "feedrate:1200;spindle_speed:8000" }
    - key: "ai.simulation.outputs"
      value: { stringValue: "max_deflection_mm:0.02" }
    - key: "ai.decision.material"
      value: { stringValue: "aluminum_6061" }
      
    # 2. AGE Intent
    - key: "ai.intent.goal"
      value: { stringValue: "high_precision_milling" }
    - key: "ai.intent.plan_step"
      value: { stringValue: "step_3_milling" }
      
    # 3. Physical Control & Protocols
    - key: "ai.physical.command"
      value: { stringValue: "SET_RPM" }
    - key: "physical.sensor.target"
      value: { stringValue: "cnc-spindle-04" }
    - key: "industrial.protocol"
      value: { stringValue: "mtconnect" }
      
    # 4. Physical Action, Deviation & Anomaly
    - key: "physical.action.status"
      value: { stringValue: "completed" }
    - key: "physical.action.duration_ms"
      value: { doubleValue: 12500.0 }
    - key: "physical.telemetry.deviation"
      value: { doubleValue: 18.2 }
    - key: "physical.anomaly.type"
      value: { stringValue: "thermal_expansion" }
    - key: "physical.anomaly.severity"
      value: { stringValue: "warning" }
      
    # 5. Human Interaction & Override
    - key: "ai.human.intervention"
      value: { boolValue: true }
    - key: "ai.human.alteration"
      value: { stringValue: "spindle_feedrate_override:75%" }
    - key: "external.interaction.type"
      value: { stringValue: "feedrate_override" }
      
    # 6. Custom Industry Extensions (Captured dynamically)
    - key: "robotics.joint.state"
      value: { stringValue: "j1:45deg;j2:12deg" }
    - key: "manufacturing.tool.wear"
      value: { doubleValue: 14.8 }
      
  Events:
    - name: "PLC Feedrate Override switch activated by operator"
      timeUnixNano: "1781880542000000000"
      attributes:
        - key: "severity"
          value: { stringValue: "WARNING" }
    - name: "Spindle speed regulated down to 6000 RPM due to heat warning"
      timeUnixNano: "1781880543000000000"
      attributes:
        - key: "severity"
          value: { stringValue: "INFO" }
```

---

## Semantic Versioning (SemVer)

This specification follows **Semantic Versioning 2.0.0** rules:
1. **Major Version (X.0.0)**: Incremented when breaking changes are introduced to the semantic conventions. A breaking change includes removing required attributes, changing the type of an existing attribute, or modifying validation requirements in a way that rejects previously valid telemetry.
2. **Minor Version (0.Y.0)**: Incremented when backward-compatible features or conventions are added. This includes adding new optional or recommended attributes, or relaxing constraints.
3. **Patch Version (0.0.Z)**: Incremented for backward-compatible bug fixes and documentation updates that do not alter the semantic schemas or validation rules.
