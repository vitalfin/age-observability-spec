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

OPC-UA is a modern, object-oriented industrial information model. Telemetry is represented by NodeIds (which contain namespaces and identifiers) containing complex variables (Process Variables).

### Mapping Nodes to Attributes

OPC-UA variables map cleanly to OTel attributes because OPC-UA uses typed variables and structured namespaces.

| OPC-UA Node Path / NodeId | Physical AI Semantic Attribute | Description / Conversion |
| :--- | :--- | :--- |
| `ns=2;s=DeviceIdentifier` | `physical.sensor.target` | Maps the OPC-UA device string name. |
| `ns=2;s=ModelCommand` | `ai.physical.command` | Maps the current active command variable string. |
| `ns=2;s=ControlDeviation` | `physical.telemetry.deviation` | Directly maps to the double precision float. |
| `ns=2;s=ExecutionStatus` | `physical.action.status` | Maps to the string representation (`completed`, `safety_abort`). |
| `ns=2;s=AnomalyActive` (Event) | `physical.anomaly.type` | If active, maps the event name/type. |

### Code Example: OPC-UA Subscription to OTel Span Generator (Node.js Concept)

```typescript
import { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem } from "node-opcua";
import { trace } from "@opentelemetry/api";

const tracer = tracer.getTracer("opcua-bridge");

async function monitorOpcUa(sessionMetadata: { sessionId: string; modelName: string }) {
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
      // AI Decision & Intent
      "ai.model.name": sessionMetadata.modelName,
      "ai.intent.goal": "docking",
      "ai.simulation.type": "kinematics",
      "ai.simulation.result": "passed",
      
      // Control & Target
      "ai.physical.command": "MOVE_TO_JOINT_COORD",
      "physical.sensor.target": "robotic-joint-j3",
      
      // Action Outcome
      "physical.telemetry.deviation": deviationVal,
      "physical.action.status": "completed",
      "physical.test.session_id": sessionMetadata.sessionId,
      "physical.test.operator_mode": "autonomous"
    });
    
    if (deviationVal > 15.0) {
      span.setAttributes({
        "physical.action.status": "safety_abort",
        "physical.anomaly.type": "joint_backlash",
        "physical.anomaly.severity": "critical",
        "physical.anomaly.corrective_action": "emergency_stop"
      });
    }
    
    span.end();
  });
}
```
