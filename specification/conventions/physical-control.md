# Physical Control & Protocols Conventions

These attributes document the direct translation of the AGE intent into physical commands sent to actuators, along with the protocol mapping context.

## Namespace Attributes

| Attribute | Type | Description | Requirement Level | Examples |
| :--- | :--- | :--- | :--- | :--- |
| `ai.physical.command` | `string` | The concrete mechanical command sent to the machine. | **Required** | `"SET_RPM"`, `"MOVE_TO_JOINT_COORD"`, `"ABORT"` |
| `physical.sensor.target` | `string` | Unique identifier of the target component, sensor, or joint. | **Required** | `"cnc-spindle-04"`, `"robotic-joint-j3"` |
| `industrial.protocol` | `string` | The industrial protocol used to interface with the machine. | **Recommended** | `"opc-ua"`, `"mtconnect"`, `"modbus"` |

## Compliance Rules (RFC 2119)

1. Telemetry spans representing direct hardware control commands **MUST** include both `ai.physical.command` and `physical.sensor.target` to identify the command action and target entity.
2. Spans interfacing with traditional industrial controllers **SHOULD** include `industrial.protocol` to identify the communication protocol used.
