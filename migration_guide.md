# Industrial Telemetry Migration Guide (Modbus & OPC-UA to OpenTelemetry)

This guide documents how to migrate and translate legacy industrial communication protocols—specifically **Modbus RTU/TCP** and **OPC Unified Architecture (OPC-UA)**—to OpenTelemetry traces enriched with the **Physical AI Semantic Conventions** for end-to-end black-box observability.

---

## 1. Overview of the Architecture

In a typical industrial telemetry pipeline, legacy controllers (PLCs, RTUs) do not speak HTTP or speak JSON, let alone OpenTelemetry. 

To bridge this gap, an **Industrial Telemetry Gateway** (or Edge IoT gateway) acts as a mediator:
1. It polls registers from Modbus or subscribes to Node variables from OPC-UA.
2. It executes or evaluates local AI/ML inference (Physical AI) to predict next states, verify safety constraints, or issue corrective commands.
3. It correlates the machine registers, target states, simulation passes, and measured deviations into a standard OpenTelemetry span.
4. It exports the span to the collector or ingest service (e.g., `trace-ingest-service`).

```
┌──────────────┐                  ┌─────────────┐                  ┌──────────────────────┐
│  Industrial  │  Modbus/OPC-UA   │ Telemetry   │   OTel Traces    │ Ingest/Observability │
│  Machinery   ├─────────────────►│ Gateway     ├─────────────────►│ Platform             │
│  (PLCs/RTUs) │  (Registers/PVs) │ (Edge AI)   │   (HTTP/gRPC)    │ (PhysiTrace/Grafana) │
└──────────────┘                  └─────────────┘                  └──────────────────────┘
```

---

## 2. Modbus RTU/TCP Mapping Guide

Modbus operates on simple numeric registers: **Coils** (discrete output), **Discrete Inputs**, **Input Registers** (read-only 16-bit analog), and **Holding Registers** (read-write 16-bit analog).

### Mapping Registers to Attributes

| Modbus Concept | Example Address / Target | Physical AI Semantic Attribute | Data Type / Conversion |
| :--- | :--- | :--- | :--- |
| **Device ID** | Slave ID `0x04` | `physical.sensor.target` | Convert target name (e.g., `"cnc-spindle-04"`) |
| **Command Register** | Holding Reg `40001` (Set Speed) | `ai.physical.command` | Map code (e.g., `1000` -> `"SET_RPM"`) |
| **Telemetry Error** | Input Reg `30012` (Actual vs. Target Diff) | `physical.telemetry.deviation` | Convert 16-bit int to float (e.g., dividing by scale) |
| **Alarm / Status** | Coil `00005` (Thermal Warning Active) | `physical.anomaly.type` / `.severity` | If Coil `00005` is `1` -> type `"thermal_expansion"`, severity `"warning"` |
| **Execution State** | Coil `00006` (Interrupted / Faulted) | `physical.action.status` | If Coil `00006` is `1` -> `"interrupted"`, else `"completed"` |

### Code Example: Modbus to OTel Span Generator (Python Concept)

```python
from opentelemetry import trace
from pyModbusTCP.client import ModbusClient

tracer = trace.get_tracer("modbus-bridge")

def poll_and_trace(ai_model_metadata, test_session_id):
    c = ModbusClient(host="192.168.1.50", port=502, auto_open=True)
    
    # Read Spindle actual deviation (Modbus register 30012)
    regs = c.read_input_registers(12, 1)
    if regs:
        deviation = regs[0] / 10.0  # e.g. raw 124 -> 12.4 RPM deviation
        
        # Read Alarm coil (Modbus coil 5)
        coils = c.read_coils(5, 1)
        anomaly_detected = coils[0] if coils else False
        
        # Start Trace Span representing the command execution
        with tracer.start_as_current_span("Modbus Telemetry Frame") as span:
            # 1. AI Decision & Simulation context injected from the controller app
            span.set_attribute("ai.model.name", ai_model_metadata["name"])
            span.set_attribute("ai.model.version", ai_model_metadata["version"])
            span.set_attribute("ai.simulation.type", "thermodynamics")
            span.set_attribute("ai.simulation.result", "passed")
            
            # 2. AI Intent
            span.set_attribute("ai.intent.goal", "high_precision_milling")
            
            # 3. Physical Control
            span.set_attribute("ai.physical.command", "SET_RPM")
            span.set_attribute("physical.sensor.target", "cnc-spindle-04")
            
            # 4. Physical Action Feedback
            span.set_attribute("physical.telemetry.deviation", deviation)
            span.set_attribute("physical.action.status", "completed")
            span.set_attribute("physical.test.session_id", test_session_id)
            span.set_attribute("physical.test.operator_mode", "human_in_the_loop")
            
            if anomaly_detected:
                span.set_attribute("physical.anomaly.type", "thermal_expansion")
                span.set_attribute("physical.anomaly.severity", "warning")
                span.set_attribute("physical.anomaly.corrective_action", "operator_alert")
```

---

## 3. OPC-UA Mapping Guide

OPC-UA is an object-oriented industrial information model. Telemetry is represented by NodeIds (which contain namespaces and identifiers) containing complex variables (Process Variables).

### Mapping Nodes to Attributes

OPC-UA variables map to OTel attributes because OPC-UA uses typed variables and structured namespaces.

| OPC-UA Node Path / NodeId | Physical AI Semantic Attribute | Description / Conversion |
| :--- | :--- | :--- |
| `ns=2;s=DeviceIdentifier` | `physical.sensor.target` | Maps the OPC-UA device string name (e.g. `"cnc-spindle-04"`). |
| `ns=2;s=ModelCommand` | `ai.physical.command` | Maps the current active command variable string (e.g. `"SET_RPM"`). |
| `ns=2;s=ControlDeviation` | `physical.telemetry.deviation` | Directly maps to the double precision float deviation. |
| `ns=2;s=ExecutionStatus` | `physical.action.status` | Maps to the string representation (`completed`, `safety_abort`). |
| `ns=2;s=AnomalyActive` (Event) | `physical.anomaly.type` | If active, maps the event name/type. |
| `ns=2;s=OperatorOverride` (Boolean) | `ai.human.intervention` | Maps to the boolean intervention flag. |
| `ns=2;s=OverrideValue` (String) | `ai.human.alteration` | Maps parameter modifications (e.g., `"spindle_speed_scale:80%"`). |

### Code Example: OPC-UA Subscription to OTel Span Generator (Node.js Concept)

```typescript
import { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem } from "node-opcua";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("opcua-bridge");

async function monitorOpcUa(sessionMetadata: { sessionId: string; modelName: string; agentId: string }) {
  const client = OPCUAClient.create({ endpointMustExist: false });
  await client.connect("opc.tcp://192.168.1.100:4840");
  const session = await client.createSession();
  
  const subscription = ClientSubscription.create(session, {
    requestedPublishingInterval: 1000,
    requestedMaxKeepAliveCount: 20,
    publishingEnabled: true,
  });

  // Monitor ControlDeviation variable
  const monitoredItem = ClientMonitoredItem.create(
    subscription,
    { nodeId: "ns=2;s=ControlDeviation", attributeId: AttributeIds.Value },
    { samplingInterval: 100, discardOldest: true, queueSize: 10 }
  );

  monitoredItem.on("changed", (dataValue) => {
    const deviationVal = dataValue.value.value as number;
    
    // Start trace span on deviation update
    const span = tracer.startSpan("OPC-UA Value Update");
    
    span.setAttributes({
      // 1. AGE Model & Decision & Simulation
      "ai.model.name": sessionMetadata.modelName,
      "ai.agent.id": sessionMetadata.agentId,
      "ai.simulation.inputs": "target_feedrate:1500;material:aluminum_6061",
      "ai.simulation.outputs": "deflection_limit_exceeded:false",
      "ai.decision.material": "aluminum_6061",
      
      // 2. AGE Intent
      "ai.intent.goal": "docking",
      
      // 3. Control, Target & Protocol
      "ai.physical.command": "MOVE_TO_JOINT_COORD",
      "physical.sensor.target": "robotic-joint-j3",
      "industrial.protocol": "opc-ua",
      
      // 4. Action Outcome
      "physical.telemetry.deviation": deviationVal,
      "physical.action.status": "completed",
      "physical.test.session_id": sessionMetadata.sessionId,
      
      // 5. Human Interaction
      "ai.human.intervention": false
    });
    
    if (deviationVal > 15.0) {
      span.setAttributes({
        "physical.action.status": "safety_abort",
        "physical.anomaly.type": "joint_backlash",
        "physical.anomaly.severity": "critical",
        "physical.anomaly.corrective_action": "emergency_stop",
        "ai.human.intervention": true,
        "ai.human.alteration": "operator_override_emergency_stop",
        "external.interaction.type": "operator_stop"
      });
    }
    
    span.end();
  });
}
```

---

## 4. MTConnect Mapping Guide

MTConnect is a standard, XML-based protocol designed for retrieving machine status and sensor telemetry from CNC machine tools and manufacturing equipment.

### Mapping XML DataItems to Attributes

MTConnect XML streams contain **Device** components composed of **DataItems** representing continuous samples or event states.

| MTConnect XML Element | DataItem Type | Physical AI Semantic Attribute | Description / Conversion |
| :--- | :--- | :--- | :--- |
| `<Device name="...">` | Component Attribute | `physical.sensor.target` | Maps the machine name. |
| `<ControllerMode>` | Event | `physical.test.operator_mode` | `AUTOMATIC` -> `"autonomous"`, `MANUAL` -> `"manual_override"`, `MANUAL_DATA_INPUT` -> `"human_in_the_loop"`. |
| `<EmergencyStop>` | Event | `physical.action.status` | If value is `TRIGGERED` -> `"safety_abort"`, and sets `ai.human.intervention` to `true`. |
| `<RotaryVelocity>` | Sample (Actual) | `physical.telemetry.deviation` | Calculate absolute delta: `|Actual - Command|` to yield deviation. |
| `<PathFeedrate>` | Sample (Actual) | `ai.human.alteration` | Parse override scale (e.g. if feedrate override is active, log scale string `"feedrate_override:80%"`). |

### Code Example: MTConnect XML Stream to OTel Converter (Python Concept)

```python
import xml.etree.ElementTree as ET
from opentelemetry import trace

tracer = trace.get_tracer("mtconnect-bridge")

def process_mtconnect_xml(xml_payload, ai_context):
    # Parse MTConnect XML Data
    root = ET.fromstring(xml_payload)
    
    # Extract data elements
    device_name = root.find(".//DeviceStream").attrib.get("name", "cnc-milling-01")
    controller_mode = root.find(".//ControllerMode").text  # e.g., "AUTOMATIC"
    estop_status = root.find(".//EmergencyStop").text       # e.g., "ARMED" or "TRIGGERED"
    
    # Calculate spindle speed deviation
    commanded_rpm = float(root.find(".//RotaryVelocity[@subType='COMMANDED']").text)
    actual_rpm = float(root.find(".//RotaryVelocity[@subType='ACTUAL']").text)
    deviation = abs(commanded_rpm - actual_rpm)
    
    # Evaluate operator intervention
    human_intervention = (controller_mode != "AUTOMATIC") or (estop_status == "TRIGGERED")
    operator_mode = "autonomous" if controller_mode == "AUTOMATIC" else "manual_override"
    
    with tracer.start_as_current_span("MTConnect Telemetry Frame") as span:
        span.set_attribute("ai.model.name", ai_context["model_name"])
        span.set_attribute("ai.agent.id", ai_context["agent_id"])
        span.set_attribute("ai.simulation.inputs", "spindle_target_rpm:" + str(commanded_rpm))
        span.set_attribute("ai.decision.material", "aluminum_6061")
        
        span.set_attribute("ai.physical.command", "SET_RPM")
        span.set_attribute("physical.sensor.target", device_name)
        span.set_attribute("industrial.protocol", "mtconnect")
        
        span.set_attribute("physical.telemetry.deviation", deviation)
        span.set_attribute("physical.action.status", "completed" if estop_status != "TRIGGERED" else "safety_abort")
        span.set_attribute("physical.test.operator_mode", operator_mode)
        span.set_attribute("ai.human.intervention", human_intervention)
        
        if human_intervention:
            span.set_attribute("ai.human.alteration", "manual_override_mode_active")
            span.set_attribute("external.interaction.type", "operator_stop" if estop_status == "TRIGGERED" else "manual_tuning")
            
        if deviation > 50.0:
            span.set_attribute("physical.anomaly.type", "thermal_expansion")
            span.set_attribute("physical.anomaly.severity", "warning")
```

---

## 5. Logs Correlation Pipeline (Fluent Bit to OTel Collector)

Fluent Bit harvesting edge machine logs (such as Linux syslog, ROS node output, or raw CNC debug logs) extracts trace propagation headers (`trace_id` / `span_id`) when available. 

A standard Fluent Bit configuration formats log lines into JSON and links them to the OTel trace context:

```
[FILTER]
    Name         parser
    Match        cnc.*
    Key_Name     log
    Parser       json_with_trace_context

[OUTPUT]
    Name         opentelemetry
    Match        *
    Host         otel-collector.eks.local
    Port         4318
    Metrics_uri  /v1/metrics
    Logs_uri     /v1/logs
```

The OpenTelemetry Collector correlates these logs and routes them to PhysiTrace's `POST /v1/logs` endpoint. This allows logs to be queried by their parent `traceId` using the query API (`GET /v1/logs?traceId=...`), aligning system-level logs directly with high-level AGE design sessions.
